import time

import pytest
import requests
from firebase_functions import https_fn
from taqo import config, paypal


def test_create_order(transaction):
    response = paypal.create_order(transaction.id)
    assert "id" in response


def test_capture_order(transaction):
    transaction_id = transaction.id
    response = paypal.create_order(transaction_id)
    order_id = response["id"]
    with pytest.raises(https_fn.HttpsError) as error:
        paypal.capture_order(transaction_id, order_id)
    assert error.value.code == https_fn.FunctionsErrorCode.ABORTED
    assert error.value.message == "ff_error/payment_failed"
    assert transaction.get().get("status") == "payment_failed"


def test_payout(transaction):
    payout_batch_id = paypal.payout(transaction.id)
    time.sleep(3)
    response = requests.get(
        f"{config.PAYPAL_PAYOUTS_URL}/{payout_batch_id}",
        headers=paypal.get_headers(),
        timeout=config.TIMEOUT,
    )
    batch_status = response.json()["batch_header"]["batch_status"]
    assert batch_status == "SUCCESS"


def test_get_seller_data(transaction):
    seller_paypal_email, seller_price = paypal.get_seller_data(transaction.id)
    assert seller_paypal_email == "FF_REDACTED@googlemail.com"
    assert seller_price == 2


def test_refresh_access_token():
    token, expires_in = paypal.refresh_access_token()
    assert len(token) == 97
    assert expires_in / 3600 >= 8
