import functools
import json
import math
import pathlib
import traceback
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Union

import firebase_admin
import markdown2  # type: ignore
import requests
import taqo
from firebase_admin import firestore, messaging
from firebase_functions import https_fn, logger, options
from google import auth  # type: ignore
from google.api_core import future
from google.cloud import pubsub_v1  # type: ignore
from taqo import config

cors_options = options.CorsOptions(cors_origins="*", cors_methods=["get", "post"])


def update_transaction(transaction_id: str, update_data: dict) -> None:
    db = firestore.client()
    transaction_ref = db.collection("transactions").document(transaction_id)
    transaction_ref.update(update_data)


def update_spot(spot_id: str, condition_func: Callable[[firestore.DocumentSnapshot], bool], update_data: dict) -> None:
    db = firestore.client()
    transaction = db.transaction()
    spot_ref = db.collection("spots").document(spot_id)

    @firestore.transactional  # type: ignore
    def update_in_transaction(transaction_):
        spot = spot_ref.get(transaction=transaction_)
        if condition_func(spot):
            transaction_.update(spot_ref, update_data)
        else:
            raise UpdateError

    update_in_transaction(transaction)


def is_available(spot: firestore.DocumentSnapshot) -> bool:
    return spot.get("status") == "available"


def is_reserved(spot: firestore.DocumentSnapshot) -> bool:
    return spot.get("status") == "reserved"


class UpdateError(ValueError):
    pass


def https_wrapper(f):
    @functools.wraps(f)
    def wrapper(request):
        if "keep-warm" in request.headers:
            return https_fn.Response("OK")
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            logger.error("Missing or invalid Authorization header")
            return https_fn.Response("Log in to perform this action.", status=401)
        id_token = auth_header.split()[1]
        try:
            decoded_token = firebase_admin.auth.verify_id_token(id_token)  # type: ignore
        except Exception as e:
            logger.error(error_to_str(e))
            return https_fn.Response("Log in to perform this action.", status=401)
        data = request.get_json()
        data["userId"] = decoded_token["uid"]
        logger.log(data, ff_type="request")
        try:
            response = f(data)
            logger.log(response, ff_type="response")
            return response if response is not None else https_fn.Response("OK")
        except https_fn.HttpsError as e:
            logger.error(error_to_str(e))
            return https_fn.Response(e.message, status=400)

    return wrapper


def tame_errors(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(error_to_str(e))
            return None

    return wrapper


def send_notification(user_ids: Union[str, list[str]], title: str, body: str, data: dict[str, str]) -> None:
    messaging_tokens = get_messaging_tokens(user_ids)
    if not messaging_tokens:
        return
    notification = messaging.Notification(title=title, body=body)
    message = messaging.MulticastMessage(
        notification=notification,
        data=data,
        tokens=messaging_tokens,
        apns=messaging.APNSConfig(payload=messaging.APNSPayload(aps=messaging.Aps(content_available=True))),
        android=messaging.AndroidConfig(priority="high"),
    )
    messaging.send_each_for_multicast(message)


def get_messaging_tokens(user_ids: Union[str, list[str]]) -> list[str]:
    db = firestore.client()
    if not isinstance(user_ids, list):
        user_ids = [user_ids]
    messaging_tokens = []
    for user_id in user_ids:
        user_ref = db.collection("users").document(user_id)
        try:
            messaging_token = user_ref.get().get("messagingToken")
            if messaging_token:
                messaging_tokens.append(messaging_token)
        except KeyError:
            continue
    return messaging_tokens


def send_email(to: str, subject: str, body: str) -> None:
    if "@" not in to:
        to = get_email_address(to)
    response = requests.post(
        config.MAILGUN_URL,  # type: ignore
        auth=("api", config.MAILGUN_API_KEY),  # type: ignore
        data={
            "from": f"Taqo <{config.OUTBOUND_EMAIL}>",
            "to": to,
            "subject": subject,
            "html": markdown2.markdown(body),
            "text": body,
        },
        timeout=config.TIMEOUT,
    )
    assert response.status_code == 200


def get_email_address(user_id: str) -> str:
    user = firebase_admin.auth.get_user(user_id)  # type: ignore
    return user.email


def get_email(name: str) -> str:
    path = functions_root() / "resources" / "email_templates" / f"{name}.md"
    with open(path, "r", encoding="utf-8") as file:
        return file.read()


def functions_root() -> pathlib.Path:
    return pathlib.Path(taqo.__file__).parent.parent


@tame_errors
def enqueue_email(to: str, subject: str, body: str, block: bool) -> future.Future:
    data = {"to": to, "subject": subject, "body": body}
    return publish_message("send-email", data, block)


@tame_errors
def enqueue_notification(
    user_ids: Union[str, list[str]],
    title: str,
    body: str,
    data: dict[str, str],
    block: bool,
) -> future.Future:
    data_ = {"userIds": user_ids, "title": title, "body": body, "data": data}
    return publish_message("send-notification", data_, block)


def publish_message(topic: str, data: dict[str, Any], block: bool) -> future.Future:
    message = json.dumps(data).encode("utf-8")
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(get_project_id(), topic)
    future_ = publisher.publish(topic_path, message)
    if block:
        future_.result()
    return future_


def get_project_id() -> str:
    _, project_id = auth.default()
    return project_id


@tame_errors
def resolve_futures(*futures: future.Future) -> None:
    for future_ in futures:
        future_.result()


def timestamp(minutes_ago: int = 0, hours_ago: int = 0) -> int:
    n_minutes_ago = utc_now() - timedelta(minutes=minutes_ago, hours=hours_ago)
    return int(n_minutes_ago.timestamp())


def utc_now() -> datetime:
    return datetime.utcnow().replace(tzinfo=timezone.utc)


def add_service_fee(seller_price: int) -> float:
    if seller_price < 4:
        return seller_price + 1
    return seller_price * (1 + config.SERVICE_FEE)


def subtract_service_fee(buyer_price: float) -> float:
    return buyer_price / (1 + config.SERVICE_FEE)


def to_seller_price(buyer_price: float) -> int:
    return math.floor(subtract_service_fee(buyer_price))


def format_price(price: float) -> str:
    price_str = f"{price:.2f}".replace(".", ",")
    return f"{price_str} €"


def error_to_str(e: Exception) -> dict[str, str]:
    return {"type": type(e).__name__, "message": str(e), "traceback": traceback.format_exc()}
