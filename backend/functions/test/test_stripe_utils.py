import subprocess
import time

import pytest
from taqo import stripe_utils


def test_get_stripe_customer_id(sample_data, third_user):  # pylint: disable=unused-argument
    customer_id = stripe_utils.get_stripe_customer_id(third_user["uid"])
    assert customer_id == third_user["stripeCustomerId"]


@pytest.mark.skip(reason="additional setup required")
def test_stripe_webhook_payment_failed(transaction):
    transaction_id = transaction.id
    command = (
        f"stripe trigger payment_intent.payment_failed --add payment_intent:metadata.transactionId={transaction_id}"
    )
    subprocess.run(command, shell=True, check=True)
    time.sleep(3)
    assert transaction.get().get("status") == "payment_failed"
