import firebase_admin
import stripe
from firebase_functions import https_fn, logger, pubsub_fn, scheduler_fn
from firebase_functions.firestore_fn import DocumentSnapshot, Event, on_document_created

firebase_admin.initialize_app()

from taqo import (  # noqa: E402 pylint: disable=wrong-import-position
    config,
    core,
    paypal,
    stripe_utils,
    utils,
)


@on_document_created(document="spots/{spotId}", region=config.REGION)  # type: ignore
def set_buyer_price(event: Event[DocumentSnapshot]) -> None:
    new_value = event.data
    seller_price = new_value.get("sellerPrice")
    new_value.reference.update({"buyerPrice": utils.add_service_fee(seller_price)})


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def update_spot(data: dict) -> None:
    spot_id = data["spotId"]
    progress = data["progress"]
    seller_price = data["sellerPrice"]
    core.update_spot(spot_id, progress, seller_price)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def accept_suggested_price(data: dict) -> None:
    spot_id = data["spotId"]
    seller_price = data["sellerPrice"]
    core.accept_suggested_price(spot_id, seller_price)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def suggest_price(data: dict) -> None:
    spot_id = data["spotId"]
    user_id = data["userId"]
    buyer_price = data["buyerPrice"]
    core.suggest_price(spot_id, user_id, buyer_price)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def report_issue(data: dict) -> None:
    spot_id = data["spotId"]
    user_id = data["userId"]
    core.report_issue(spot_id, user_id)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def delete_user(data: dict) -> None:
    core.delete_user(data["userId"])


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def reserve_spot(data: dict) -> None:
    try:
        core.reserve_spot(data["spotId"])
    except utils.UpdateError as e:
        raise https_fn.HttpsError(message="ff_error/spot_unavailable", code=https_fn.FunctionsErrorCode.ABORTED) from e


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def free_spot(data: dict) -> None:
    try:
        core.free_spot(data["spotId"])
    except utils.UpdateError as e:
        raise https_fn.HttpsError(
            message="ff_error/failed_to_free_spot", code=https_fn.FunctionsErrorCode.ABORTED
        ) from e


@scheduler_fn.on_schedule(region=config.REGION, schedule="* * * * *")
def free_spots(_event: scheduler_fn.ScheduledEvent) -> None:
    core.free_spots()


@scheduler_fn.on_schedule(
    region=config.REGION,
    schedule="*/5 * * * *",
    secrets=["STRIPE_API_KEY", "PAYPAL_CLIENT_SECRET"],
)
def refund_buyers(_event: scheduler_fn.ScheduledEvent) -> None:
    core.refund_buyers()


@scheduler_fn.on_schedule(
    region=config.REGION,
    schedule="0 * * * *",
    secrets=["PAYPAL_CLIENT_SECRET"],
)
def pay_sellers(_event: scheduler_fn.ScheduledEvent) -> None:
    core.pay_sellers()


@https_fn.on_request(region=config.REGION, secrets=["STRIPE_API_KEY"])
@utils.https_wrapper
def stripe_payment_sheet(data: dict) -> dict:
    spot_id = data["spotId"]
    buyer_id = data["userId"]
    return stripe_utils.payment_sheet(spot_id, buyer_id)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def stripe_book_spot(data: dict) -> None:
    spot_id = data["spotId"]
    transaction_id = data["transactionId"]
    core.stripe_book_spot(spot_id, transaction_id)


@https_fn.on_request(region=config.REGION)
@utils.https_wrapper
def paypal_create_transaction(data: dict) -> dict[str, str]:
    spot_id = data["spotId"]
    buyer_id = data["userId"]
    transaction_ref, _ = core.create_transaction(spot_id, buyer_id, payment_provider="paypal")
    return {"transactionId": transaction_ref.id}


@https_fn.on_request(region=config.REGION, cors=utils.cors_options, secrets=["PAYPAL_CLIENT_SECRET"])
@utils.https_wrapper
def paypal_create_order(data: dict) -> dict:
    transaction_id = data["transactionId"]
    return paypal.create_order(transaction_id)


@https_fn.on_request(region=config.REGION, cors=utils.cors_options, secrets=["PAYPAL_CLIENT_SECRET"])
@utils.https_wrapper
def paypal_book_spot(data: dict) -> None:
    spot_id = data["spotId"]
    transaction_id = data["transactionId"]
    order_id = data["orderId"]
    core.paypal_book_spot(spot_id, transaction_id, order_id)


@https_fn.on_request(region=config.REGION, secrets=["STRIPE_ENDPOINT_SECRET"])
def stripe_webhook(req: https_fn.Request) -> https_fn.Response:
    try:
        event = stripe.Webhook.construct_event(req.data, req.headers["Stripe-Signature"], config.STRIPE_ENDPOINT_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):  # type: ignore
        logger.error("Invalid signature")
        return https_fn.Response("ff_error/invalid_signature", status=400)
    return stripe_utils.handle_webhook(event)


@https_fn.on_request(region=config.REGION, secrets=["PAYPAL_CLIENT_SECRET"])
def paypal_webhook(req: https_fn.Request) -> https_fn.Response:
    try:
        paypal.verify_webhook_signature(req)
    except AssertionError:
        logger.error("Invalid signature")
        return https_fn.Response("ff_error/invalid_signature", status=400)
    event = req.get_json()
    return paypal.handle_webhook(event)


@pubsub_fn.on_message_published(topic="send-email", region=config.REGION, secrets=["MAILGUN_API_KEY"])
def send_email(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    data = event.data.message.json
    utils.send_email(data["to"], data["subject"], data["body"])  # type: ignore


@pubsub_fn.on_message_published(topic="send-notification", region=config.REGION)
def send_notification(event: pubsub_fn.CloudEvent[pubsub_fn.MessagePublishedData]) -> None:
    data = event.data.message.json
    utils.send_notification(data["userIds"], data["title"], data["body"], data["data"])  # type: ignore
