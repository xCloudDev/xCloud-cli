import test from 'node:test';
import assert from 'node:assert/strict';
import { buildURL, resolveRoute } from '../lib/routes.js';
import { makeHeaders } from '../lib/http.js';
import { errorPayload, format } from '../lib/output.js';

test('buildURL prefixes public and enterprise API paths', () => {
  assert.equal(
    buildURL('https://app.xcloud.host/', 'public', '/servers', ['page=2', 'search=wp']),
    'https://app.xcloud.host/api/v1/servers?page=2&search=wp'
  );
  assert.equal(
    buildURL('https://app.xcloud.host', 'enterprise', '/server/abc'),
    'https://app.xcloud.host/api/enterprise/v1.0/server/abc'
  );
});

test('resolveRoute maps safe command names to actual endpoints', () => {
  const resolved = resolveRoute('public', ['servers', 'power-cycle', 'srv-uuid']);
  const route = resolved.route;
  assert.equal(route[0], 'POST');
  assert.equal(route[1](resolved.params[0]), '/servers/srv-uuid/reboot');
  assert.equal(route[2], true);
});

test('makeHeaders injects bearer token without changing caller token', () => {
  const headers = makeHeaders('secret-token');
  assert.equal(headers.Authorization, 'Bearer secret-token');
  assert.equal(headers.Accept, 'application/json');
});

test('json error output has stable shape', () => {
  const err = Object.assign(new Error('boom'), { code: 'Boom', details: { status: 422 } });
  const payload = errorPayload(err);
  assert.deepEqual(payload, { success: false, error: { code: 'Boom', message: 'boom', details: { status: 422 } } });
  assert.match(format(payload, 'json'), /"success": false/);
});
