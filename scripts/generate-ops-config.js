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

const source = `// Generated file. Do not commit.\n` +
  `export const OPS_API_BASE = ${JSON.stringify(apiBase)};\n` +
  `export const OPS_APP_KEY = ${JSON.stringify(appKey)};\n`;
fs.writeFileSync(outputPath, source, 'utf8');
console.log('Generated ops runtime configuration.');
