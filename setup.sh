#!/usr/bin/env bash

set -eu

cd backend/functions
python -m venv venv
source venv/bin/activate
pip install -r requirements_dev.txt
deactivate
cd -

cd mobile
cd paypal_webview && yarn install && cd -
cd app && yarn install && cd -
cd app/ios && pod install && cd -
cd ..
