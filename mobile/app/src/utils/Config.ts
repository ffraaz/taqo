import firebase from '@react-native-firebase/app';

const prod = firebase.app().options.projectId === 'FF_REDACTED';
const staging = false;
const remoteBackend = prod || staging;

const devIpAddress = 'FF_REDACTED';

const stripePublishableKeyLive = 'FF_REDACTED';
const stripePublishableKeyTest = 'FF_REDACTED';

let stripePublishableKey;
let payPalUrl;
let baseUrl;
let googlePayTestEnv;

if (staging) {
  stripePublishableKey = stripePublishableKeyTest;
  payPalUrl = 'https://TAQO_DEMO.web.app/';
  baseUrl = 'https://method_name-FF_REDACTED-ey.a.run.app';
  googlePayTestEnv = true;
} else if (prod) {
  stripePublishableKey = stripePublishableKeyLive;
  payPalUrl = 'https://FF_REDACTED.web.app/';
  baseUrl = 'https://method_name-FF_REDACTED-ey.a.run.app';
  googlePayTestEnv = false;
} else {
  stripePublishableKey = stripePublishableKeyTest;
  payPalUrl = `http://${devIpAddress}:3000/`;
  baseUrl = `http://${devIpAddress}:5001/TAQO_DEMO/europe-west3`;
  googlePayTestEnv = true;
}

const bundleId = 'com.FF_REDACTED.taqo';

const reviewerEmailAddresses = [
  'review_demo_account@FF_REDACTED.com',
  'apple_review_account@FF_REDACTED.com',
];

const reviewerIds = [
  'FF_REDACTED',
  'FF_REDACTED',
  'FF_REDACTED',
  'FF_REDACTED',
  'FF_REDACTED',
  'FF_REDACTED',
];

export const config = {
  devIpAddress,
  remoteBackend,
  stripePublishableKey,
  payPalUrl,
  baseUrl,
  googlePayTestEnv,
  bundleId,
  reviewerEmailAddresses,
  reviewerIds,
};
