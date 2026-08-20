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

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

console.log('Release-critical invite and cold-start checks passed.');
