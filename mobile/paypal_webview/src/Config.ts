const prod = process.env.NODE_ENV === 'production';
const staging = process.env.REACT_APP_DEPLOY_ENVIRONMENT === 'dev';
const remoteBackend = prod || staging;

const devIpAddress = 'FF_REDACTED';

const paypalClientIdLive = 'FF_REDACTED';
const paypalClientIdTest = 'FF_REDACTED';

let paypalClientId;
let baseUrl;

if (staging) {
  paypalClientId = paypalClientIdTest;
  baseUrl = 'https://method_name-FF_REDACTED-ey.a.run.app';
} else if (prod) {
  paypalClientId = paypalClientIdLive;
  baseUrl = 'https://method_name-FF_REDACTED-ey.a.run.app';
} else {
  paypalClientId = paypalClientIdTest;
  baseUrl = `http://${devIpAddress}:5001/TAQO_DEMO/europe-west3`;
}

export const config = {
  remoteBackend,
  paypalClientId,
  baseUrl,
};
