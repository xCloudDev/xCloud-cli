import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadConfig, redact, saveProfile } from '../lib/config.js';

test('loadConfig applies file, env, then flag precedence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xcloud-cli-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify({
    default_profile: 'work',
    profiles: { work: { base_url: 'https://file.example', token: 'file-token', api_flavor: 'public' } }
  }));

  const cfg = loadConfig(
    { config: file, baseUrl: 'https://flag.example' },
    { XCLOUD_API_TOKEN: 'env-token', XCLOUD_API_FLAVOR: 'enterprise' }
  );

  assert.equal(cfg.baseURL, 'https://flag.example');
  assert.equal(cfg.token, 'env-token');
  assert.equal(cfg.apiFlavor, 'enterprise');
  assert.equal(cfg.profile, 'work');
});

test('saveProfile writes config and redaction hides token body', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xcloud-cli-'));
  const file = path.join(dir, 'config.json');
  const saved = saveProfile(file, 'agent', { base_url: 'https://app.xcloud.host', token: '1234567890abcdef', api_flavor: 'public' });
  assert.equal(saved.token, '1234567890abcdef');
  assert.equal(redact(saved.token), '1234…cdef');
  const disk = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(disk.profiles.agent.api_flavor, 'public');
});
