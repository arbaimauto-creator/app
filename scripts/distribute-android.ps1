# greyd 안드로이드 팀 배포 — Firebase App Distribution
# 사전 1회: npx firebase-tools login  (브라우저 로그인)
# 사용법:  powershell -ExecutionPolicy Bypass -File scripts\distribute-android.ps1 [-Notes "변경 요약"]
param(
  [string]$Notes = "greyd internal build",
  [string]$Apk = "android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk",
  [string]$Group = "team"
)

$AppId = "1:939266442600:android:c35432b5f255bef2e442dd" # com.arbaim.greyd (google-services.json)

if (-not (Test-Path $Apk)) {
  Write-Host "APK가 없습니다: $Apk — 먼저 빌드하세요 (cd android; .\gradlew :app:assembleDebug)" -ForegroundColor Red
  exit 1
}

npx.cmd firebase-tools appdistribution:distribute $Apk `
  --app $AppId `
  --groups $Group `
  --release-notes $Notes
