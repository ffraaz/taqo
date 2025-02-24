# Taqo
Taqo is a marketplace for spots in real-world waiting lines. A person close to the front of the line can sell their spot
to someone who wishes to skip the line. You can watch a demo of the app [here](https://youtu.be/gkVTv7hvH2Q).

## Setup
1. Install [React Native](https://reactnative.dev/docs/0.71/environment-setup) requirements.
2. Create a [Firebase](https://firebase.google.com/) project and enable Firestore, Functions, Storage, Authentication, Hosting, and Dynamic Links.
3. Install the [Firebase CLI](https://firebase.google.com/docs/cli) and set up [Application Default Credentials](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment).
4. Add an [iOS app](https://firebase.google.com/docs/ios/setup) and [Android app](https://firebase.google.com/docs/android/setup) to your Firebase project. Search for `FIREBASE_CONFIG_TODO` in the codebase to determine the config destinations.
5. Replace all occurrences of `TAQO_DEMO` in the codebase with your Firebase project ID.
6. Create a `.env` file in `backend/functions` with all the environment variables required by `backend/functions/taqo/config.py`.
7. Adapt `mobile/app/src/utils/Config.ts` and `mobile/paypal_webview/src/Config.ts` to your setup.
8. Run `./setup.sh`.

## Test
```bash
./ci.sh
```

## Deploy
```bash
./deploy.sh
```

## Run
Execute each command in a separate shell:
```bash
cd backend && firebase emulators:start
```
```bash
cd mobile/paypal_webview && yarn start
```
```bash
cd mobile/app && yarn ios
```
```bash
cd mobile/app && yarn android
```

## License
[MIT](https://github.com/ffraaz/taqo/blob/main/LICENSE)
