const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const failures = [];

const features = read('Components/Constants/Features.js');
const linking = read('Components/utils/linking.js');
const invites = read('api/invites.js');
const runtime = read('api/opsRuntimeConfig.js');

if (!/LIVE_OPS_API:\s*true/.test(features)) {
  failures.push('LIVE_OPS_API must be true for a production release');
}
if (!/TEST_GUEST_ENTRY:\s*false/.test(features)) {
  failures.push('TEST_GUEST_ENTRY must be false for a production release');
}
if (!/COMMERCE:\s*false/.test(features)) {
  failures.push('legacy commerce must remain disabled until its routes are restored');
}
if (
  !/GROUP_BUY_MOCK:\s*(false|\(?typeof __DEV__ !== 'undefined' && __DEV__\)?( \|\| GROUPBUY_PREVIEW)?),/.test(
    features,
  )
) {
  failures.push('group-buy mock server must be off (or dev-only) in a production release');
}
// 공동구매 미리보기(테스트 데이터)는 TestFlight 시연 빌드 전용 — 스토어 배포(production) 프로필에서는 금지
if (/GROUPBUY_PREVIEW = true/.test(runtime) && process.env.EAS_BUILD_PROFILE === 'production') {
  failures.push('group-buy preview (mock data) must not be enabled in the production build profile');
}
if (!/const DEFAULT_URL = null;/.test(linking) || linking.includes('mylinker://')) {
  failures.push('normal cold starts must return null, not a placeholder deep link');
}
if (invites.includes('FEATURES.LIVE_OPS_API')) {
  failures.push('invite authentication must never be gated by LIVE_OPS_API');
}
if (!/OPS_API_BASE = "https:\/\//.test(runtime)) {
  failures.push('OPS_API_BASE must use HTTPS');
}
if (/OPS_APP_KEY = ""/.test(runtime)) {
  failures.push('OPS_APP_KEY must be generated before release');
}

const androidBuild = read('android/app/build.gradle');
if (!/include\s+"arm64-v8a"/.test(androidBuild)) {
  failures.push('release APK must include the supported arm64-v8a ABI');
}
if (/include\s+"[^"]*x86/.test(androidBuild)) {
  failures.push('x86 APKs must not be generated without complete FFmpeg native libraries');
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Release-critical invite and cold-start checks passed.');
