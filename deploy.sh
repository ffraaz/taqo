#!/usr/bin/env bash

set -eux

DEPLOY_ENVIRONMENT=dev
export REACT_APP_DEPLOY_ENVIRONMENT=$DEPLOY_ENVIRONMENT

echo "Deploying to $DEPLOY_ENVIRONMENT"

./ci.sh

cd mobile/paypal_webview && yarn build && cd -

cd backend
firebase use $DEPLOY_ENVIRONMENT
firebase deploy
cd -
