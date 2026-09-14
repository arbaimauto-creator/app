// Read-only server smoke check. Never print credentials or response records.
const fs = require('fs');
const path = require('path');
const config = fs.readFileSync(path.join(__dirname, '../api/opsRuntimeConfig.js'), 'utf8');
const readConstant = (name) => JSON.parse(config.match(new RegExp(`${name}\\s*=\\s*("[^"\\r\\n]*")`))[1]);
async function main() {
  const base = readConstant('OPS_API_BASE');
  const key = readConstant('OPS_APP_KEY');
  for (const route of ['/campaigns', '/seedings']) {
    const response = await fetch(`${base}${route}`, {
      headers: process.env.OPS_SMOKE_TOKEN
        ? { Authorization: `Bearer ${process.env.OPS_SMOKE_TOKEN}` }
        : { 'x-greyd-app-key': key },
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(() => null);
    const authRequired = route === '/seedings' && !process.env.OPS_SMOKE_TOKEN && response.status === 401;
    console.log(JSON.stringify({ route, status: response.status, json: body !== null,
      authenticatedCheck: Boolean(process.env.OPS_SMOKE_TOKEN), authRequired,
      count: Array.isArray(body?.campaigns) ? body.campaigns.length : undefined,
      missingFgiSetting: Array.isArray(body?.campaigns)
        ? body.campaigns.filter(c => typeof c.fgiEnabled !== 'boolean').length : undefined,
    }));
    if (!response.ok && !authRequired) process.exitCode = 1;
  }
}
main().catch(error => { console.error(error.name, error.cause?.code || 'request failed'); process.exitCode = 1; });
