# Shorts verification — 2026-09-17

Scope: Pixel 6 API 35 Android emulator. Manual checks used emulator-5560 with latest source served by Metro 8088.

## Passed

- Jest: 25 suites / 146 tests.
- ESLint on changed Shorts components; git diff --check.
- Android x86_64 debug APK build and installation.
- Final production Android JS bundle: .harness/shorts-reading.android.bundle.
- Review card remains visible during playback.
- Comments panel opens and closes; same review returns and playback resumes.
- hardwareAccelerated on the Android Modal fixes the black video background observed while the panel was open.
- Expanded review text and hashtags display.
- Upward swipe on expanded card: OlesiaStefanko to SofiaSultana.
- Downward swipe on expanded card: SofiaSultana to OlesiaStefanko.
- Header position, player height and playback touch overlay position corrected and visually checked.

## Screenshot evidence

Directory: .harness/shorts-verification/

- qa-accelerated-panel.png and qa-panel-still.png: comments panel with retained video frame.
- qa-resumed-a.png and qa-resumed-b.png: different playback frames of the same review after closing the panel.
- qa-expanded.png: expanded review and hashtags.
- qa-expanded-next.png: next review after swiping the expanded card.
- qa-expanded-previous.png: previous review after swiping downward; buffering indicator present at capture time.
- qa-card-persistent.png: review card remains visible during playback.

## Limits

The final production JS bundle was generated separately. A release APK containing the final JS was not installed. Physical Android devices and iOS were not tested. Manual UI coverage focused on Shorts; the passing full test suite does not imply manual coverage of every app screen. No comments, saves or purchases were submitted.

The UiAutomator journey did not complete because video playback prevented idle detection. Its results are not counted as passing evidence; UI findings above come from direct interaction and inspected screenshots.
