# pylint: disable=redefined-outer-name,no-member
from unittest import mock

import pytest
from firebase_functions import https_fn
from taqo import config, utils


def test_update_transaction(transaction):
    transaction_id = transaction.id
    utils.update_transaction(transaction_id, {"status": "charged_buyer"})
    assert transaction.get().get("status") == "charged_buyer"


def test_update_spot_success(db, sample_data):
    spot_id = sample_data
    utils.update_spot(spot_id, utils.is_available, {"status": "reserved"})
    spot_ref = db.collection("spots").document(spot_id)
    assert spot_ref.get().get("status") == "reserved"


def test_update_spot_error(db, sample_data):
    spot_id = sample_data
    spot_ref = db.collection("spots").document(spot_id)
    spot_ref.update({"status": "deleted"})
    with pytest.raises(utils.UpdateError):
        utils.update_spot(spot_id, utils.is_available, {"status": "reserved"})
    assert spot_ref.get().get("status") == "deleted"


@utils.https_wrapper
def mock_function(_data):
    return {"message": "Function executed"}


# noinspection PyUnresolvedReferences
def test_missing_auth_header():
    request = mock.Mock()
    request.headers = {}
    response = mock_function(request)
    assert response.data.decode() == "Log in to perform this action."
    assert response.status_code == 401


# noinspection PyUnresolvedReferences
def test_invalid_token(mocker):
    mocker.patch("firebase_admin.auth.verify_id_token", side_effect=ValueError)
    request = mock.Mock()
    request.headers = {"Authorization": "Bearer invalid_token"}
    response = mock_function(request)
    assert response.data.decode() == "Log in to perform this action."
    assert response.status_code == 401


def test_valid_token(mocker):
    mocker.patch("firebase_admin.auth.verify_id_token", return_value={"uid": "user123"})
    request = mock.Mock()
    request.headers = {"Authorization": "Bearer valid_token"}
    request.get_json.return_value = {}
    response = mock_function(request)
    assert response["message"] == "Function executed"


def test_function_raises_https_error(mocker):
    mocker.patch("firebase_admin.auth.verify_id_token", return_value={"uid": "user123"})
    request = mock.Mock()
    request.headers = {"Authorization": "Bearer valid_token"}
    request.get_json.return_value = {}

    @utils.https_wrapper
    def mock_function_raises_error(_data):
        raise https_fn.HttpsError(message="An error occurred", code=https_fn.FunctionsErrorCode.ABORTED)

    response = mock_function_raises_error(request)
    assert response.data.decode() == "An error occurred"
    assert response.status_code == 400


def test_tame_errors():
    @utils.tame_errors
    def successful_function(a, b):
        return a + b

    @utils.tame_errors
    def failing_function():
        raise ValueError("failure")

    assert successful_function(1, 2) == 3
    failing_function()


@pytest.fixture
def body():
    return "Your spot has been sold successfully. Please leave the line when the buyer shows you the badge."


def test_send_notification_ios(sample_data, ios_user, body):
    spot_id = sample_data
    utils.send_notification(
        user_ids=ios_user["uid"],
        title="Sale",
        body=body,
        data={
            "type": "price_reduction",
            "spotId": spot_id,
            "sellerPrice": "10",
            "body": "The price of Rental Car Counter was reduced to 10 Euro.",
        },
    )


def test_send_notification_android(android_user, body):
    utils.send_notification(user_ids=android_user["uid"], title="Sale", body=body, data={"type": "sold_spot"})


def test_send_notification_multiple_users(ios_user, android_user, body):
    utils.send_notification(
        user_ids=[ios_user["uid"], android_user["uid"], "user123"],
        title="Sale",
        body=body,
        data={"type": "sold_spot"},
    )


def test_get_message_tokens(ios_user, android_user, third_user):
    assert utils.get_messaging_tokens("user123") == []  # pylint: disable=C1803
    assert utils.get_messaging_tokens(third_user["uid"]) == []  # pylint: disable=C1803
    assert utils.get_messaging_tokens(ios_user["uid"]) == [ios_user["messagingToken"]]
    assert utils.get_messaging_tokens([ios_user["uid"], android_user["uid"], third_user["uid"], "user123"]) == [
        ios_user["messagingToken"],
        android_user["messagingToken"],
    ]


def test_send_email():
    utils.send_email(config.OPS_EMAIL, "Test", utils.get_email("account_deleted"))


@pytest.mark.parametrize(
    "buyer_price, expected_seller_price",
    [
        (2, 1),
        (3, 2),
        (4, 3),
        (5, 4),
        (6, 4),
        (7, 5),
    ],
)
def test_to_seller_price(buyer_price, expected_seller_price):
    assert utils.to_seller_price(buyer_price) == expected_seller_price


@pytest.mark.parametrize(
    "price, expected_price_str",
    [
        (1, "1,00 €"),
        (10, "10,00 €"),
        (12.2, "12,20 €"),
        (12.30, "12,30 €"),
    ],
)
def test_format_price(price, expected_price_str):
    assert utils.format_price(price) == expected_price_str
