import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoutePath, buildURL, resolveRoute } from '../lib/routes.js';
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
  assert.equal(buildRoutePath(route, resolved.params, resolved.key), '/servers/srv-uuid/reboot');
  assert.equal(route[2], true);
});

test('resolveRoute supports public API branch additions', () => {
  assert.equal(
    buildRoutePath(resolveRoute('public', ['integrations', 'cloudflare']).route, []),
    '/integrations/cloudflare'
  );
  assert.equal(
    buildRoutePath(
      resolveRoute('public', ['servers', 'delete-sudo-user', 'srv-uuid', 'sudo-uuid']).route,
      ['srv-uuid', 'sudo-uuid']
    ),
    '/servers/srv-uuid/sudo-users/sudo-uuid'
  );
  assert.equal(
    buildRoutePath(resolveRoute('public', ['servers', 'create-wordpress-site', 'srv-uuid']).route, ['srv-uuid']),
    '/servers/srv-uuid/sites/wordpress'
  );
  assert.equal(
    buildRoutePath(resolveRoute('public', ['sites', 'monitoring', 'site-uuid']).route, ['site-uuid']),
    '/sites/site-uuid/monitoring'
  );
  assert.equal(
    resolveRoute('public', ['sites', 'update-ssh', 'site-uuid']).route[0],
    'PUT'
  );
});

test('resolveRoute supports enterprise site endpoints from API docs', () => {
  assert.equal(
    buildRoutePath(resolveRoute('enterprise', ['enterprise', 'sites', 'list']).route, []),
    '/sites'
  );
  assert.equal(
    buildRoutePath(resolveRoute('enterprise', ['enterprise', 'sites', 'publish-staging', 'site-uuid']).route, ['site-uuid']),
    '/site/site-uuid/staging/publish'
  );
  assert.equal(
    buildRoutePath(resolveRoute('enterprise', ['enterprise', 'sites', 'create-ssh-key', 'site-uuid']).route, ['site-uuid']),
    '/site/site-uuid/ssh-keys'
  );
});

test('buildRoutePath rejects missing multi-parameter route args', () => {
  const resolved = resolveRoute('public', ['servers', 'delete-sudo-user', 'srv-uuid']);
  assert.throws(
    () => buildRoutePath(resolved.route, resolved.params, resolved.key),
    /missing required 2 ids/
  );
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
