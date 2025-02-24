import os

ENV = "" if os.getenv("ENVIRONMENT") == "prod" else "_DEV"

REGION = os.getenv("REGION")  # e.g., europe-west3
SERVICE_FEE = float(os.getenv("SERVICE_FEE"))  # type: ignore  # e.g., 0.25
TIMEOUT = int(os.getenv("TIMEOUT"))  # type: ignore  # e.g, 10

MAILGUN_URL = os.getenv("MAILGUN_URL")  # e.g., https://api.mailgun.net/v3/FF_REDACTED/messages
MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY" + ENV)
OUTBOUND_EMAIL = os.getenv("OUTBOUND_EMAIL")
OPS_EMAIL = os.getenv("OPS_EMAIL" + ENV)

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY" + ENV)
STRIPE_ENDPOINT_SECRET = os.getenv("STRIPE_ENDPOINT_SECRET" + ENV)

PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET" + ENV)
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID" + ENV)
PAYPAL_WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID" + ENV)

PAYPAL_BASE_URL = os.getenv("PAYPAL_URL" + ENV)  # e.g., https://api-m.sandbox.paypal.com
assert PAYPAL_BASE_URL is not None
PAYPAL_PAYOUTS_URL = PAYPAL_BASE_URL + "/v1/payments/payouts"
PAYPAL_OAUTH_URL = PAYPAL_BASE_URL + "/v1/oauth2/token"
PAYPAL_VERIFY_WEBHOOK_URL = PAYPAL_BASE_URL + "/v1/notifications/verify-webhook-signature"
PAYPAL_ORDERS_URL = PAYPAL_BASE_URL + "/v2/checkout/orders"
PAYPAL_CAPTURES_URL = PAYPAL_BASE_URL + "/v2/payments/captures/"
