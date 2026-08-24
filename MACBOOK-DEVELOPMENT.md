# GREYD MacBook development handoff

## Recommended environment

- Apple Silicon Mac (M1/M2/M3/M4)
- Xcode and Xcode Command Line Tools
- Android Studio with Android SDK 35 and an ARM64 emulator
- Node.js 20 LTS
- JDK 17
- CocoaPods (for iOS work)

## First setup

```bash
cd app-master
corepack enable
yarn install
npm run preandroid
```

The dependency install runs `patch-package`. The files in `patches/` must remain in the project because they contain compatibility fixes required by the Android release build.

## Run Android

Start an ARM64 Android emulator in Android Studio, then use two terminals:

```bash
npm start
```

```bash
npm run android
```

## Run tests

```bash
npm test -- --runInBand
npm run verify:release
```

## Build a release APK

Release signing credentials are intentionally not included in this archive. Put the signing keystore in `android/app/` and configure the `MYAPP_RELEASE_*` values in `android/gradle.properties` before making an externally distributed release.

```bash
cd android
./gradlew assembleRelease
```

Output:

`android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`

## Local configuration

`.env`, `credentials.json`, signing keystores, generated build output, and installed dependencies are excluded for security and portability. Transfer required secrets separately through a secure channel. Never commit them to a public repository.
