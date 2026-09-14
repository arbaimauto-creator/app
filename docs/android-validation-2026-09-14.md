# Android validation — 2026-09-14

## Changes

- Android versionName 1.92.30, base versionCode 244 (ABI-specific APK codes retain the existing offset).
- Require explicit `fgiEnabled: true` to require the optional FGI survey.
- Merge server settlement fields (`pointsGranted`, `paidAt`) at equal or later seeding status, including zero/null corrections. Preserve local progress against stale server states.
- Add regression coverage for optional FGI and settlement merging.
- Update the existing Reanimated patch's CMake object path limit from 128 to 240 and shorten Windows native staging to `.native/reanimated` to address the observed Ninja path-length failure.
- Exclude generated Android app build, `.native`, and `.cxx` directories from Metro's file map and limit Windows Metro workers to two after an observed file-watcher startup timeout.
- Add `node scripts/check-ops-android.cjs`: read-only API probe, no response records or credentials printed. Optional `OPS_SMOKE_TOKEN` enables authenticated checks; keep the token outside source control.

## Verified

- Jest: 13 suites, 75 tests passed.
- Release configuration script passed.
- Reanimated arm64 native compilation and JavaScript/Hermes bundle generation passed after shortening the staging path.
- Live `/campaigns`: HTTP 200, JSON response, zero campaigns.
- Live `/seedings` with application key only: HTTP 401. User-session verification remains pending; this is not an authenticated end-to-end pass.

## Pending

- Standard release build reached Sentry source-map upload and failed with HTTP 401 (missing/invalid credentials). Local verification build is being retried with `SENTRY_DISABLE_AUTO_UPLOAD=true`; this is not a production monitoring fix.
- No Android devices were listed by ADB. Installation, cold start, update install, login recovery, camera/upload, and physical arm64 regression remain unverified.
- An authenticated test account and a test campaign are required for participation/submission/reward verification.
- Existing Sentry DSN ownership and event delivery were not verified. Source-map upload credentials must be repaired before the normal release pipeline can pass.
- Commerce/brand flags retain the documented feature-retention policy; restoring those workflows requires route and integration validation.

No store or tester distribution was performed. No production campaign, participation, or payment records were modified by the API probe.
