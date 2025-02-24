#!/usr/bin/env bash

TARGETS="functions/taqo/ functions/main.py functions/test"

set -eux

tsc --noEmit -p mobile/app
tsc --noEmit -p mobile/paypal_webview
npx eslint mobile/app mobile/paypal_webview

cd backend
set +x
source functions/venv/bin/activate
set -x
black --check .
isort --check .
pylint $TARGETS
mypy $TARGETS
pytest functions
deactivate
cd -
