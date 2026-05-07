#!/usr/bin/env node
import { loadConfig, saveProfile, redact } from '../lib/config.js';
import { buildURL, resolveRoute } from '../lib/routes.js';
import { requestJSON } from '../lib/http.js';
import { confirmDangerous } from '../lib/confirm.js';
import { format, errorPayload } from '../lib/output.js';

function parse(argv) {
  const flags = { query: [] };
  const args = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') flags.yes = true;
    else if (a === '--profile') flags.profile = argv[++i];
    else if (a === '--config') flags.config = argv[++i];
    else if (a === '--base-url') flags.baseUrl = argv[++i];
    else if (a === '--token') flags.token = argv[++i];
    else if (a === '--api-flavor') flags.apiFlavor = argv[++i];
    else if (a === '--output' || a === '-o') flags.output = argv[++i];
    else if (a === '--data' || a === '-d') flags.data = argv[++i];
    else if (a === '--query' || a === '-q') flags.query.push(argv[++i]);
    else args.push(a);
  }
  return { flags, args };
}

function usage() {
  return `xcloud - agent-ready CLI for xCloud APIs

Usage:
  xcloud [global flags] health
  xcloud [global flags] configure --base-url URL --token TOKEN [--api-flavor public|enterprise]
  xcloud [global flags] api get|post|patch|delete <path> [--data JSON] [--query k=v]
  xcloud [global flags] servers list|show|sites|databases|cron-jobs|monitoring|tasks|php-versions|sudo-users|power-cycle [uuid]
  xcloud [global flags] sites list|show|backups|status|ssl|domain|events|deployment-logs|git|ssh|backup|purge-cache [uuid]
  xcloud [global flags] enterprise servers|users|addon ...

Global flags: --profile --config --base-url --token --api-flavor --output table|json|yaml --yes
Env: XCLOUD_BASE_URL XCLOUD_API_TOKEN XCLOUD_API_FLAVOR XCLOUD_PROFILE
`;
}

async function run(argv = process.argv.slice(2)) {
  const { flags, args } = parse(argv);
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') return { print: usage(), code: 0 };

  const cfg = loadConfig(flags);

  if (args[0] === 'configure') {
    const saved = saveProfile(cfg.config, cfg.profile, {
      base_url: cfg.baseURL,
      token: cfg.token,
      api_flavor: cfg.apiFlavor
    });
    return { payload: { success: true, profile: cfg.profile, config: cfg.config, saved: { ...saved, token: redact(saved.token) } }, code: 0, output: cfg.output };
  }

  let method, path, dangerous = false;
  let query = flags.query || [];
  let data = flags.data;
  if (args[0] === 'api') {
    method = String(args[1] || '').toUpperCase();
    path = args[2];
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method) || !path) throw new Error('api usage: xcloud api get|post|patch|delete <path>');
    dangerous = ['POST', 'PATCH', 'DELETE'].includes(method);
  } else if (args[0] === 'health') {
    [method, path] = ['GET', '/health'];
  } else {
    const flavor = args[0] === 'enterprise' ? 'enterprise' : cfg.apiFlavor;
    const resolved = resolveRoute(flavor, args);
    if (!resolved) throw new Error(`unknown command: ${args.join(' ')}`);
    const { route, params, key } = resolved;
    cfg.apiFlavor = flavor;
    method = route[0];
    if (typeof route[1] === 'function') {
      if (!params[0]) throw new Error(`missing required id for command: ${key}`);
      path = route[1](params[0]);
    } else {
      if (params.length) throw new Error(`unexpected argument(s) for command: ${key}`);
      path = route[1];
    }
    dangerous = Boolean(route[2]);
  }

  if (dangerous && !(await confirmDangerous(`About to run ${method} ${path}.`, cfg.yes))) {
    throw Object.assign(new Error('confirmation required; pass --yes for non-interactive use'), { code: 'ConfirmationRequired', status: 3 });
  }

  let parsedData;
  if (data !== undefined) {
    try { parsedData = JSON.parse(data); } catch { throw new Error('--data must be valid JSON'); }
  }

  const url = buildURL(cfg.baseURL, cfg.apiFlavor, path, query);
  const response = await requestJSON(url, { method, token: cfg.token, data: parsedData });
  return { payload: { success: true, ...response }, code: 0, output: cfg.output };
}

run().then(result => {
  if (result.print) process.stdout.write(result.print);
  else process.stdout.write(format(result.payload, result.output));
  process.exitCode = result.code;
}).catch(err => {
  const mode = process.argv.includes('--output') ? process.argv[process.argv.indexOf('--output') + 1] : (process.argv.includes('-o') ? process.argv[process.argv.indexOf('-o') + 1] : 'table');
  process.stderr.write(format(errorPayload(err), ['json', 'yaml', 'table'].includes(mode) ? mode : 'table'));
  process.exitCode = err.status || 1;
});

export { run, parse };
