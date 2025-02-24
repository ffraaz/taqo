import textwrap
from typing import Any

import firebase_admin
import stripe
from firebase_admin import firestore
from firebase_functions import https_fn, logger
from google.api_core import future
from taqo import config, paypal, utils

stripe.api_key = config.STRIPE_API_KEY


def update_spot(spot_id: str, progress: int, seller_price: int) -> None:
    notify_buyers = has_price_reduced(spot_id, seller_price)
    buyer_price = utils.add_service_fee(seller_price)
    update = {
        "progress": progress,
        "sellerPrice": seller_price,
        "buyerPrice": buyer_price,
    }
    try:
        utils.update_spot(spot_id, utils.is_available, update)
    except utils.UpdateError as e:
        raise https_fn.HttpsError(message="ff_error/spot_unavailable", code=https_fn.FunctionsErrorCode.ABORTED) from e
    if notify_buyers:
        notify_interested_buyers(spot_id, buyer_price)


def has_price_reduced(spot_id: str, new_seller_price: int) -> bool:
    db = firestore.client()
    spot_ref = db.collection("spots").document(spot_id)
    old_seller_price = spot_ref.get().get("sellerPrice")
    price_reduced = new_seller_price < old_seller_price
    return price_reduced


@utils.tame_errors
def notify_interested_buyers(spot_id: str, buyer_price: float) -> None:
    db = firestore.client()
    spot_ref = db.collection("spots").document(spot_id)
    spot = spot_ref.get().to_dict()
    try:
        interested_buyer_ids = spot["interestedBuyerIds"]
    except KeyError:
        return
    queue_name = spot["queueName"]
    body = f"The price of {queue_name} was reduced to {utils.format_price(buyer_price)}."
    utils.enqueue_notification(
        interested_buyer_ids,
        title="Price Update",
        body=body,
        data={"type": "price_reduction", "body": body},
        block=True,
    )


def accept_suggested_price(spot_id: str, seller_price: int) -> None:
    buyer_price = utils.add_service_fee(seller_price)
    update = {
        "sellerPrice": seller_price,
        "buyerPrice": buyer_price,
    }
    try:
        utils.update_spot(spot_id, utils.is_available, update)
    except utils.UpdateError as e:
        raise https_fn.HttpsError(message="ff_error/spot_unavailable", code=https_fn.FunctionsErrorCode.ABORTED) from e
    notify_interested_buyers(spot_id, buyer_price)


def free_spots() -> None:
    db = firestore.client()
    spots_ref = db.collection("spots")
    query = spots_ref.where("status", "==", "reserved").where("reservedAt", "<=", utils.timestamp(minutes_ago=5))
    spots = query.stream()
    for spot in spots:
        try:
            free_spot(spot.id)
        except utils.UpdateError:
            logger.error(f"Failed to free spot {spot.id}.")


def free_spot(spot_id: str) -> None:
    utils.update_spot(spot_id, utils.is_reserved, {"status": "available"})
    logger.log(f"Spot {spot_id} has been freed.")


def pay_sellers() -> None:
    db = firestore.client()
    transactions_ref = db.collection("transactions")
    query = transactions_ref.where("payout_status", "==", "payout_pending").where(
        "bookedAt", "<=", utils.timestamp(hours_ago=12)
    )
    transactions = query.stream()
    for transaction in transactions:
        try_payout(transaction.id)


def try_payout(transaction_id: str) -> None:
    try:
        payout_batch_id = paypal.payout(transaction_id)
        logger.log(f"Successfully initiated payout for transaction {transaction_id}. Batch ID: {payout_batch_id}.")
    except Exception as e:
        logger.error(utils.error_to_str(e))
        utils.update_transaction(transaction_id, update_data={"payout_status": "payout_failed"})
        utils.enqueue_email(config.OPS_EMAIL, "Payout Failed", f"Transaction ID: {transaction_id}", block=True)


def refund_buyers() -> None:
    db = firestore.client()
    transactions_ref = db.collection("transactions")
    query = transactions_ref.where("status", "==", "to_refund").where("bookedAt", "<=", utils.timestamp(minutes_ago=2))
    transactions = query.stream()
    for transaction in transactions:
        try_refund(transaction.id)


def try_refund(transaction_id: str) -> None:
    try:
        refund(transaction_id)
        logger.log(f"Successfully initiated refund for transaction {transaction_id}.")
    except Exception as e:
        logger.error(utils.error_to_str(e))
        utils.update_transaction(transaction_id, update_data={"status": "refund_failed"})
        utils.enqueue_email(config.OPS_EMAIL, "Refund Failed", f"Transaction ID: {transaction_id}", block=True)


def refund(transaction_id: str) -> None:
    db = firestore.client()
    transaction_ref = db.collection("transactions").document(transaction_id)
    transaction = transaction_ref.get().to_dict()
    if transaction["paymentProvider"] == "stripe":
        payment_intent_id = transaction["paymentIntentId"]
        stripe.Refund.create(payment_intent=payment_intent_id)
    else:
        capture_id = transaction["captureId"]
        paypal.refund(transaction_id, capture_id)


def create_transaction(spot_id: str, buyer_id: str, payment_provider: str) -> tuple[Any, dict]:
    db = firestore.client()
    spot_doc = db.collection("spots").document(spot_id).get().to_dict()
    transaction = {
        "status": "pending",
        "spotId": spot_id,
        "queueName": spot_doc["queueName"],
        "sellerId": spot_doc["sellerId"],
        "buyerId": buyer_id,
        "sellerPrice": spot_doc["sellerPrice"],
        "buyerPrice": spot_doc["buyerPrice"],
        "paymentProvider": payment_provider,
        "createdAt": firestore.SERVER_TIMESTAMP,  # type: ignore
    }
    _, transaction_ref = db.collection("transactions").add(transaction)
    return transaction_ref, transaction


def stripe_book_spot(spot_id: str, transaction_id: str) -> None:
    ensure_spot_is_reserved(spot_id, transaction_id, initiate_refund=True)
    assert_consistent_price(spot_id, transaction_id, initiate_refund=True)
    update_as_success(spot_id, transaction_id)


def paypal_book_spot(spot_id: str, transaction_id: str, order_id: str) -> None:
    ensure_spot_is_reserved(spot_id, transaction_id, initiate_refund=False)
    assert_consistent_price(spot_id, transaction_id, initiate_refund=False)
    paypal.capture_order(transaction_id, order_id)
    update_as_success(spot_id, transaction_id)


def ensure_spot_is_reserved(spot_id: str, transaction_id: str, initiate_refund: bool) -> None:
    try:
        reserve_spot(spot_id)
    except utils.UpdateError as e:
        db = firestore.client()
        spot_ref = db.collection("spots").document(spot_id)
        spot_status = spot_ref.get().get("status")
        if spot_status != "reserved":
            if initiate_refund:
                utils.update_transaction(
                    transaction_id, update_data={"status": "to_refund", "bookedAt": utils.timestamp()}
                )
            raise https_fn.HttpsError(
                message="ff_error/spot_unavailable", code=https_fn.FunctionsErrorCode.ABORTED
            ) from e


def reserve_spot(spot_id: str) -> None:
    utils.update_spot(spot_id, utils.is_available, {"status": "reserved", "reservedAt": utils.timestamp()})


def assert_consistent_price(spot_id: str, transaction_id: str, initiate_refund: bool) -> None:
    if not is_price_consistent(spot_id, transaction_id):
        if initiate_refund:
            utils.update_transaction(transaction_id, update_data={"status": "to_refund", "bookedAt": utils.timestamp()})
        free_spot(spot_id)
        raise https_fn.HttpsError(message="ff_error/invalid_spot_price", code=https_fn.FunctionsErrorCode.ABORTED)


def is_price_consistent(spot_id: str, transaction_id: str) -> bool:
    db = firestore.client()
    spot_ref = db.collection("spots").document(spot_id)
    spot_buyer_price = spot_ref.get().get("buyerPrice")
    transaction_ref = db.collection("transactions").document(transaction_id)
    transaction_buyer_price = transaction_ref.get().get("buyerPrice")
    return spot_buyer_price == transaction_buyer_price


def update_as_success(spot_id: str, transaction_id: str) -> None:
    try:
        utils.update_spot(spot_id, utils.is_reserved, {"status": "sold"})
        utils.update_transaction(
            transaction_id,
            update_data={
                "status": "charged_buyer",
                "payout_status": "payout_pending",
                "bookedAt": utils.timestamp(),
            },
        )
        notify_stakeholders(spot_id, transaction_id)
    except utils.UpdateError as e:
        utils.update_transaction(transaction_id, update_data={"status": "to_refund", "bookedAt": utils.timestamp()})
        raise https_fn.HttpsError(
            message="ff_error/spot_unavailable/charged", code=https_fn.FunctionsErrorCode.ABORTED
        ) from e


@utils.tame_errors
def notify_stakeholders(spot_id: str, transaction_id: str) -> None:
    seller_notification_future, seller_email_future = notify_seller_of_sale(spot_id)
    buyer_email_future = notify_buyer_of_sale(transaction_id)
    ops_email_future = notify_operators_of_sale(spot_id, transaction_id)
    utils.resolve_futures(seller_notification_future, seller_email_future, buyer_email_future, ops_email_future)


def notify_seller_of_sale(spot_id: str) -> tuple[future.Future, future.Future]:
    seller_id = get_seller_id(spot_id)
    notification_future = utils.enqueue_notification(
        seller_id,
        title="Sale",
        body="Your spot has been sold successfully. Please leave the line when the buyer shows you the badge.",
        data={"type": "sold_spot"},
        block=False,
    )
    email_future = utils.enqueue_email(seller_id, "Spot Sold", utils.get_email("spot_sold"), block=False)
    return notification_future, email_future


def notify_buyer_of_sale(transaction_id: str) -> future.Future:
    db = firestore.client()
    transaction_ref = db.collection("transactions").document(transaction_id)
    buyer_id = transaction_ref.get().get("buyerId")
    return utils.enqueue_email(buyer_id, "Spot Booked", utils.get_email("spot_booked"), block=False)


def notify_operators_of_sale(spot_id: str, transaction_id: str) -> future.Future:
    return utils.enqueue_email(
        config.OPS_EMAIL,
        "Spot Sold",
        textwrap.dedent(
            f"""\
            Spot ID: {spot_id}
            Transaction ID: {transaction_id}
            """
        ),
        block=False,
    )


def get_seller_id(spot_id: str) -> str:
    db = firestore.client()
    spot_ref = db.collection("spots").document(spot_id)
    seller_id = spot_ref.get().get("sellerId")
    return seller_id


def delete_user(user_id: str) -> None:
    if has_open_spots(user_id):
        raise https_fn.HttpsError(message="ff_error/user_has_active_offer", code=https_fn.FunctionsErrorCode.ABORTED)
    firebase_admin.auth.update_user(user_id, disabled=True)  # type: ignore
    utils.enqueue_email(user_id, "Account Deleted", utils.get_email("account_deleted"), block=True)


def has_open_spots(user_id: str) -> bool:
    db = firestore.client()
    spots_ref = db.collection("spots")
    query = spots_ref.where("sellerId", "==", user_id).where("status", "in", ["available", "reserved"])
    spots = query.stream()
    n_spots = sum(1 for _ in spots)
    return n_spots > 0


def report_issue(spot_id: str, reporter_id: str) -> None:
    utils.update_spot(spot_id, utils.is_available, {"issueReporterIds": firestore.ArrayUnion([reporter_id])})  # type: ignore
    if n_issue_reporters(spot_id) < 2:
        return
    try:
        utils.update_spot(spot_id, utils.is_available, {"status": "deleted"})
        logger.log(f"Spot {spot_id} has been deleted.")
    except utils.UpdateError:
        return
    seller_id = get_seller_id(spot_id)
    notification_future = utils.enqueue_notification(
        seller_id,
        title="Action Required",
        body="Multiple potential buyers were not able to find you. Your spot has been deleted. Please create a new offer if you still want to sell your spot.",
        data={"type": "spot_deleted_due_to_issue"},
        block=False,
    )
    email_future = utils.enqueue_email(seller_id, "Spot Deleted", utils.get_email("spot_deleted"), block=False)
    utils.resolve_futures(notification_future, email_future)


def n_issue_reporters(spot_id: str) -> int:
    db = firestore.client()
    spot_ref = db.collection("spots").document(spot_id)
    issue_reporter_ids = spot_ref.get().get("issueReporterIds")
    return len(issue_reporter_ids)


def suggest_price(spot_id: str, user_id: str, buyer_price: float) -> None:
    try:
        utils.update_spot(spot_id, utils.is_available, {"interestedBuyerIds": firestore.ArrayUnion([user_id])})  # type: ignore
    except utils.UpdateError as e:
        raise https_fn.HttpsError(message="ff_error/spot_unavailable", code=https_fn.FunctionsErrorCode.ABORTED) from e
    seller_price = utils.to_seller_price(buyer_price)
    seller_id = get_seller_id(spot_id)
    utils.enqueue_notification(
        seller_id,
        title="Interested Buyer",
        body=f"A potential buyer is interested in your spot at a lower price of {utils.format_price(seller_price)}.",
        data={
            "type": "price_suggested",
            "spotId": spot_id,
            "sellerPrice": str(seller_price),
        },
        block=True,
    )
