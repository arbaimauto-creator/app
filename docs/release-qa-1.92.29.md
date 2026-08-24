# Release QA — Android 1.92.29 (243)

## Completed

- Release configuration generation and cold-start/invite invariants
- 35 automated tests covering invite handling, campaigns, navigation contracts, mission deadlines, grace/no-show boundaries, creator points, and concurrency limits
- Existing consumer, B2B, and brand route-retention checks
- Disabled-commerce route and deep-link checks
- About/Settings service terms and privacy-policy URL checks
- Release APK and AAB builds
- APK v2 signature, AAB JAR signature, package/version, and arm64 Hermes/FFmpeg library checks

## Requires a physical arm64 Android device

- Fresh install, invite entry, login, force-stop, and relaunch
- Existing production-user login and retained data
- Airplane-mode launch followed by network recovery
- Background/foreground recovery
- Camera, microphone, media picker, and review upload
- Push-notification and verified deep-link delivery
- Campaign application, address submission, FGI, review-link submission, rewards, and withdrawal
- B2B inquiry and brand contract account verification

The connected local emulator is x86_64. The production APK intentionally contains only arm64 native libraries because FFmpegKit does not provide the required x86 runtime in this project.
