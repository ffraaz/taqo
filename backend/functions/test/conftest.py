# pylint: disable=redefined-outer-name
import os
import subprocess
import time

import firebase_admin
import pytest
import requests
import stripe
from firebase_admin import firestore
from taqo import config, core, utils

stripe.api_key = config.STRIPE_API_KEY


@pytest.fixture(scope="session", autouse=True)
def use_firestore_emulator():
    os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
    firebase_admin.initialize_app()
    with subprocess.Popen(["firebase", "emulators:start"], stdout=subprocess.PIPE, stderr=subprocess.PIPE) as process:
        time.sleep(10)
        yield
        process.terminate()


@pytest.fixture(scope="session")
def db():
    return firestore.client()


@pytest.fixture
def clear_db():
    url = f"http://localhost:8080/emulator/v1/projects/{utils.get_project_id()}/databases/(default)/documents"
    requests.delete(url, timeout=config.TIMEOUT)


@pytest.fixture
def transaction(sample_data, android_user):
    spot_id = sample_data
    transaction_ref, _ = core.create_transaction(spot_id, android_user["uid"], payment_provider="paypal")
    return transaction_ref


@pytest.fixture(scope="session")
def stripe_customer():
    customer = stripe.Customer.create()
    stripe.PaymentMethod.attach("pm_card_visa", customer=customer["id"])
    return customer["id"]


@pytest.fixture
def ios_user():
    return {
        "uid": "1jk9yDuWoBQvEvnDLGAhu7UYoHh1",
        "paypalEmail": "FF_REDACTED@me.com",
        "stripeCustomerId": "cus_Q4QKMKFT7AnJVI",
        "messagingToken": "e4YG4jdfokDblVo9JQL78v:APA91bEeMYANBfHpai8ZWZGhQmJ1fzKP7KyS5wkAejswjJB550yb3frZGHx9F3m8MF2f68WaaQKoMm7d6vKyGLTsEAi-jv-NsZWaADeI8PSHRXloeQb6vPp0aKjq83F9mTACWpaGqd6d",
    }


@pytest.fixture
def android_user(stripe_customer):
    return {
        "uid": "x1EZn7vazrMfFCDbTRljqLhr3A22",
        "paypalEmail": "FF_REDACTED@gmail.com",
        "stripeCustomerId": stripe_customer,
        "messagingToken": "f0q1JPblR5272yOywQ2Sks:APA91bG3T8l0wfxWLtF2zQdi-hUzzPobV4tVHPW8TK9BsG2MBWGBKhLkpS5ygICG3aET9ru6YeuCMkJqTNEHr-_8exIrtFQXlDvYVPVobKTJae0mwLAeya3wAxs8Jcv7upFNFxpS9CLz",
    }


@pytest.fixture
def third_user():
    return {
        "uid": "Y5fHDPcXsSak4kpTs4G48NW0YXE3",
        "paypalEmail": "FF_REDACTED@googlemail.com",
        "stripeCustomerId": "cus_Q4QKMKFT7AnJVI",
    }


@pytest.fixture
def sample_data(db, clear_db, ios_user, android_user, third_user):  # pylint: disable=unused-argument
    db.collection("config").document("appVersion").set({"minRequired": "1.0.4"})
    db.collection("users").document(ios_user["uid"]).set(ios_user)
    db.collection("users").document(android_user["uid"]).set(android_user)
    db.collection("users").document(third_user["uid"]).set(third_user)
    _, user_ref = db.collection("users").add(third_user)
    seller_3_id = user_ref.id

    spot_1 = {
        "createdAt": "2024-03-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.12226953125, "longitude": -3.593833936781728},
        "progress": 75,
        "queueName": "Ice Cream Shop",
        "sellerId": third_user["uid"],
        "sellerPrice": 2,
        "status": "available",
    }

    spot_2 = {
        "createdAt": "2024-03-05T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.13626953125, "longitude": -3.593833936781728},
        "progress": 80,
        "queueName": "Nightclub",
        "sellerId": seller_3_id,
        "sellerPrice": 8,
        "status": "available",
    }

    spot_3 = {
        "createdAt": "2024-01-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.17426953125, "longitude": -3.593833936781728},
        "progress": 90,
        "queueName": "Rental Car Counter",
        "sellerId": seller_3_id,
        "sellerPrice": 9,
        "status": "available",
    }

    spot_4 = {
        "createdAt": "2024-01-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.18226953125, "longitude": -3.593833936781728},
        "progress": 90,
        "queueName": "Museum",
        "sellerId": ios_user["uid"],
        "sellerPrice": 10,
        "status": "available",
    }

    spot_5 = {
        "createdAt": "2024-01-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.17326953125, "longitude": -3.593833936781728},
        "progress": 95,
        "queueName": "Furniture Store",
        "sellerId": android_user["uid"],
        "sellerPrice": 5,
        "status": "available",
    }

    spot_6 = {
        "createdAt": "2024-01-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.19026953125, "longitude": -3.593833936781728},
        "progress": 85,
        "queueName": "Mulled Wine Stand",
        "sellerId": seller_3_id,
        "sellerPrice": 3,
        "status": "available",
    }

    spot_7 = {
        "createdAt": "2024-01-03T19:01:28.164Z",
        "downloadUrl": "https://FF_REDACTED",
        "location": {"latitude": 37.17226953125, "longitude": -3.593833936781728},
        "progress": 80,
        "queueName": "Football Stadium",
        "sellerId": seller_3_id,
        "sellerPrice": 4,
        "status": "available",
    }

    _, spot_ref = db.collection("spots").add(spot_1)
    db.collection("spots").add(spot_2)
    db.collection("spots").add(spot_3)
    db.collection("spots").add(spot_4)
    db.collection("spots").add(spot_5)
    db.collection("spots").add(spot_6)
    db.collection("spots").add(spot_7)
    time.sleep(1)
    return spot_ref.id
