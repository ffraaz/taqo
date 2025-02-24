import stripe
from firebase_admin import firestore
from firebase_functions import https_fn
from taqo import config, core, utils

stripe.api_key = config.STRIPE_API_KEY


def payment_sheet(spot_id: str, buyer_id: str) -> dict:
    customer_id = get_stripe_customer_id(buyer_id)
    transaction_ref, transaction = core.create_transaction(spot_id, buyer_id, payment_provider="stripe")
    transaction_id = transaction_ref.id
    ephemeral_key = stripe.EphemeralKey.create(
        customer=customer_id,
        stripe_version="2023-10-16",
    )
    payment_intent = stripe.PaymentIntent.create(
        amount=int(transaction["buyerPrice"] * 100),
        currency="eur",
        customer=customer_id,
        metadata={"transactionId": transaction_id},
    )
    transaction_ref.update({"paymentIntentId": payment_intent.id})
    return {
        "paymentIntentClientSecret": payment_intent.client_secret,
        "transactionId": transaction_id,
        "ephemeralKey": ephemeral_key.secret,
        "customer": customer_id,
    }


def get_stripe_customer_id(user_id: str) -> str:
    db = firestore.client()
    user_ref = db.collection("users").document(user_id)
    user_doc = user_ref.get()
    if user_doc.exists and "stripeCustomerId" in user_doc.to_dict():
        return user_doc.get("stripeCustomerId")
    customer = stripe.Customer.create()
    customer_id = customer["id"]
    user_ref.set({"stripeCustomerId": customer_id})
    return customer_id


def handle_webhook(event: dict) -> https_fn.Response:
    event_type = event["type"]
    transaction_id = event["data"]["object"]["metadata"]["transactionId"]
    if event_type == "payment_intent.payment_failed":
        utils.update_transaction(transaction_id, update_data={"status": "payment_failed"})
    elif event_type == "charge.refunded":
        utils.update_transaction(transaction_id, update_data={"status": "payment_refunded"})
    return https_fn.Response("OK")
