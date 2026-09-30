const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
const outputPath = path.join(root, 'api', 'opsRuntimeConfig.js');

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).reduce((values, line) => {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!match) return values;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    return values;
  }, {});
}

const fileEnv = readEnvFile(envPath);
const appKey = process.env.GREYD_APP_MOBILE_KEY || fileEnv.GREYD_APP_MOBILE_KEY || '';
const apiBase = process.env.GREYD_OPS_API_BASE || fileEnv.GREYD_OPS_API_BASE ||
  'https://greyd-ops.vercel.app/api/mobile';

if (!appKey) throw new Error('GREYD_APP_MOBILE_KEY is missing from the environment or .env');

// 공동구매 미리보기 빌드(TestFlight 시연용) — 서버 없이 기기 안 테스트 데이터로 공동구매 화면을 연다.
// eas.json의 testflight-groupbuy 프로필만 켠다. production 프로필에서는 verify-release가 막는다.
const groupBuyPreview = (process.env.GREYD_GROUPBUY_PREVIEW || fileEnv.GREYD_GROUPBUY_PREVIEW) === '1';

const source = `// Generated file. Do not commit.\n` +
  `export const OPS_API_BASE = ${JSON.stringify(apiBase)};\n` +
  `export const OPS_APP_KEY = ${JSON.stringify(appKey)};\n` +
  `export const GROUPBUY_PREVIEW = ${groupBuyPreview};\n`;
fs.writeFileSync(outputPath, source, 'utf8');
console.log('Generated ops runtime configuration.');
