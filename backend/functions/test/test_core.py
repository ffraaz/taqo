import pytest
from firebase_admin import firestore
from firebase_functions import https_fn
from taqo import core, utils


def test_update_spot(db, sample_data):
    spot_id = sample_data
    progress = 10
    seller_price = 100

    core.update_spot(spot_id, progress, seller_price)

    spot_ref = db.collection("spots").document(spot_id)
    spot = spot_ref.get().to_dict()
    assert spot["progress"] == progress
    assert spot["sellerPrice"] == seller_price
    assert spot["buyerPrice"] == utils.add_service_fee(seller_price)

    utils.update_spot(spot_id, utils.is_available, {"status": "reserved"})

    with pytest.raises(https_fn.HttpsError):
        core.update_spot(spot_id, progress + 10, seller_price + 10)

    assert spot["progress"] == progress
    assert spot["sellerPrice"] == seller_price
    assert spot["buyerPrice"] == utils.add_service_fee(seller_price)


def test_has_price_reduced(sample_data):
    spot_id = sample_data
    assert not core.has_price_reduced(spot_id, 2)
    assert not core.has_price_reduced(spot_id, 10)
    assert core.has_price_reduced(spot_id, 1)


def test_notify_interested_buyers(db, sample_data, ios_user):
    spot_id = sample_data
    core.notify_interested_buyers(spot_id, 10)
    spot_ref = db.collection("spots").document(spot_id)
    spot_ref.update({"interestedBuyerIds": firestore.ArrayUnion([ios_user["uid"]])})  # type: ignore
    core.notify_interested_buyers(spot_id, 10)


def test_free_spots(db):
    def create_test_spot(spot_id, status, reserved_at):
        spot_ref = db.collection("spots").document(spot_id)
        spot_ref.set({"status": status, "reservedAt": reserved_at})

    def get_status(spot_id):
        return db.collection("spots").document(spot_id).get().get("status")

    create_test_spot("spot1", "reserved", utils.timestamp(3))
    create_test_spot("spot2", "reserved", utils.timestamp(5))
    create_test_spot("spot3", "reserved", utils.timestamp(10))
    create_test_spot("spot4", "sold", utils.timestamp(10))

    core.free_spots()
    assert get_status("spot1") == "reserved"
    assert get_status("spot2") == "available"
    assert get_status("spot3") == "available"
    assert get_status("spot4") == "sold"


def test_ensure_spot_is_reserved(db, sample_data, transaction):
    spot_id = sample_data
    transaction_id = transaction.id
    spot_ref = db.collection("spots").document(spot_id)
    assert spot_ref.get().get("status") == "available"
    core.ensure_spot_is_reserved(spot_id, transaction_id, initiate_refund=True)
    assert spot_ref.get().get("status") == "reserved"
    assert transaction.get().get("status") == "pending"
    core.ensure_spot_is_reserved(spot_id, transaction_id, initiate_refund=True)
    assert spot_ref.get().get("status") == "reserved"
    assert transaction.get().get("status") == "pending"
    utils.update_spot(spot_id, utils.is_reserved, {"status": "sold"})
    with pytest.raises(https_fn.HttpsError):
        core.ensure_spot_is_reserved(spot_id, transaction_id, initiate_refund=True)
    assert spot_ref.get().get("status") == "sold"
    assert transaction.get().get("status") == "to_refund"


def test_is_price_consistent(sample_data, transaction):
    spot_id = sample_data
    transaction_id = transaction.id
    assert core.is_price_consistent(spot_id, transaction_id)
    core.update_spot(spot_id, progress=10, seller_price=100)
    assert not core.is_price_consistent(spot_id, transaction_id)


def test_has_open_spots(sample_data, third_user):  # pylint: disable=unused-argument
    assert not core.has_open_spots("user123")
    assert core.has_open_spots(third_user["uid"])


def test_report_issue(db, sample_data):
    spot_id = sample_data
    reporter_1_id = "reporter1"
    reporter_2_id = "reporter2"
    spot_ref = db.collection("spots").document(spot_id)

    core.report_issue(spot_id, reporter_1_id)
    issue_reporter_ids = spot_ref.get().get("issueReporterIds")
    assert reporter_1_id in issue_reporter_ids
    assert spot_ref.get().get("status") == "available"

    core.report_issue(spot_id, reporter_2_id)
    issue_reporter_ids = spot_ref.get().get("issueReporterIds")
    assert reporter_1_id in issue_reporter_ids
    assert reporter_2_id in issue_reporter_ids
    assert spot_ref.get().get("status") == "deleted"


def test_suggest_price(db, sample_data, ios_user):
    spot_id = sample_data
    core.suggest_price(spot_id, ios_user["uid"], 10)
    spot_ref = db.collection("spots").document(spot_id)
    interested_buyer_ids = spot_ref.get().get("interestedBuyerIds")
    assert interested_buyer_ids == [ios_user["uid"]]
