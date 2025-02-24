import json
import time

import requests
from firebase_admin import firestore
from firebase_functions import https_fn
from taqo import config, utils


def create_order(transaction_id: str) -> dict:
    headers = get_headers()
    buyer_price = get_buyer_price(transaction_id)
    data = {
        "intent": "CAPTURE",
        "purchase_units": [{"amount": {"currency_code": "EUR", "value": str(buyer_price)}}],
    }
    response = requests.post(
        config.PAYPAL_ORDERS_URL,
        headers=headers,
        data=json.dumps(data),
        timeout=config.TIMEOUT,
    ).json()
    assert "id" in response
    return response


def get_buyer_price(transaction_id: str) -> float:
    db = firestore.client()
    transaction_ref = db.collection("transactions").document(transaction_id)
    buyer_price = transaction_ref.get().get("buyerPrice")
    assert buyer_price
    return buyer_price


def capture_order(transaction_id: str, order_id: str) -> None:
    headers = get_headers()
    url = f"{config.PAYPAL_ORDERS_URL}/{order_id}/capture"
    response = requests.post(url, headers=headers, timeout=config.TIMEOUT).json()
    if "details" in response:
        utils.update_transaction(transaction_id, update_data={"status": "payment_failed"})
        raise https_fn.HttpsError(message="ff_error/payment_failed", code=https_fn.FunctionsErrorCode.ABORTED)
    transaction = response["purchase_units"][0]["payments"]["captures"][0]
    assert transaction["status"] == "COMPLETED"
    utils.update_transaction(transaction_id, update_data={"captureId": transaction["id"]})


def refund(transaction_id: str, capture_id: str) -> None:
    headers = get_headers()
    url = f"{config.PAYPAL_CAPTURES_URL}/{capture_id}/refund"
    response = requests.post(url, headers=headers, data="{}", timeout=config.TIMEOUT)
    assert response.status_code == 201
    assert response.json()["status"] == "COMPLETED"
    utils.update_transaction(transaction_id, update_data={"status": "payment_refunded"})


def payout(transaction_id: str) -> str:
    seller_paypal_email, seller_price = get_seller_data(transaction_id)
    payout_batch_id = send_money(seller_paypal_email, seller_price, transaction_id)
    return payout_batch_id


def get_seller_data(transaction_id: str) -> tuple[str, int]:
    db = firestore.client()
    transaction_ref = db.collection("transactions").document(transaction_id)
    transaction = transaction_ref.get().to_dict()
    seller_price = transaction["sellerPrice"]
    seller_id = transaction["sellerId"]
    seller_paypal_email = db.collection("users").document(seller_id).get().get("paypalEmail")
    return seller_paypal_email, seller_price


def send_money(seller_paypal_email: str, seller_price: int, transaction_id: str) -> str:
    headers = get_headers()

    data = {
        "sender_batch_header": {
            "sender_batch_id": transaction_id,
            "email_subject": "Your Taqo payout",
            "recipient_type": "EMAIL",
        },
        "items": [
            {
                "amount": {"value": str(seller_price), "currency": "EUR"},
                "receiver": seller_paypal_email,
            }
        ],
    }

    response = requests.post(
        config.PAYPAL_PAYOUTS_URL,
        headers=headers,
        data=json.dumps(data),
        timeout=config.TIMEOUT,
    )
    assert response.status_code == 201
    payout_batch_id = response.json()["batch_header"]["payout_batch_id"]
    return payout_batch_id


def handle_webhook(event: dict) -> https_fn.Response:
    event_type = event["event_type"]
    transaction_id = event["resource"]["batch_header"]["sender_batch_header"]["sender_batch_id"]
    if event_type == "PAYMENT.PAYOUTSBATCH.SUCCESS":
        utils.update_transaction(transaction_id, update_data={"payout_status": "payout_succeeded"})
    elif event_type == "PAYMENT.PAYOUTSBATCH.DENIED":
        utils.update_transaction(transaction_id, update_data={"payout_status": "payout_failed"})
        utils.enqueue_email(config.OPS_EMAIL, "Payout Failed", f"Transaction ID: {transaction_id}", block=True)
    return https_fn.Response("OK")


def verify_webhook_signature(req: https_fn.Request) -> None:
    headers = get_headers()
    data = {
        "auth_algo": req.headers["Paypal-Auth-Algo"],
        "cert_url": req.headers["Paypal-Cert-Url"],
        "transmission_id": req.headers["Paypal-Transmission-Id"],
        "transmission_sig": req.headers["Paypal-Transmission-Sig"],
        "transmission_time": req.headers["Paypal-Transmission-Time"],
        "webhook_id": config.PAYPAL_WEBHOOK_ID,
        "webhook_event": req.get_json(),
    }
    response = requests.post(
        config.PAYPAL_VERIFY_WEBHOOK_URL,
        headers=headers,
        data=json.dumps(data),
        timeout=config.TIMEOUT,
    )
    assert response.status_code == 200
    assert response.json()["verification_status"] == "SUCCESS"


def get_headers() -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {get_access_token()}",
    }


def get_access_token() -> str:
    token_ref = firestore.client().collection("paypal_token_cache").document("token")
    token_doc = token_ref.get()
    if token_doc.exists and time.time() < token_doc.get("expiration"):
        return token_doc.get("token")
    token, expires_in = refresh_access_token()
    token_ref.set({"token": token, "expiration": time.time() + expires_in - 600})
    return token


def refresh_access_token() -> tuple[str, int]:
    auth = (config.PAYPAL_CLIENT_ID, config.PAYPAL_CLIENT_SECRET)
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {"grant_type": "client_credentials"}
    response = requests.post(
        config.PAYPAL_OAUTH_URL,
        auth=auth,  # type: ignore
        headers=headers,
        data=data,
        timeout=config.TIMEOUT,
    ).json()
    return response["access_token"], response["expires_in"]
