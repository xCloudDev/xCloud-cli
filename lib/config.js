import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const defaultConfigPath = () => path.join(os.homedir(), '.config', 'xcloud', 'config.json');

export function redact(value) {
  if (!value) return value;
  const s = String(value);
  if (s.length <= 8) return '[REDACTED]';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export function readConfig(file) {
  if (!file || !fs.existsSync(file)) return { profiles: {} };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function loadConfig(flags = {}, env = process.env) {
  const file = flags.config || env.XCLOUD_CONFIG || defaultConfigPath();
  const config = readConfig(file);
  const profileName = flags.profile || env.XCLOUD_PROFILE || config.default_profile || 'default';
  const profile = config.profiles?.[profileName] || {};
  const merged = {
    profile: profileName,
    config: file,
    baseURL: flags.baseUrl || env.XCLOUD_BASE_URL || profile.base_url || 'https://app.xcloud.host',
    token: flags.token || env.XCLOUD_API_TOKEN || profile.token || '',
    apiFlavor: flags.apiFlavor || env.XCLOUD_API_FLAVOR || profile.api_flavor || 'public',
    output: flags.output || env.XCLOUD_OUTPUT || 'table',
    yes: Boolean(flags.yes)
  };
  if (!['public', 'enterprise'].includes(merged.apiFlavor)) {
    throw new Error('api flavor must be public or enterprise');
  }
  if (!['table', 'json', 'yaml'].includes(merged.output)) {
    throw new Error('output must be table, json, or yaml');
  }
  return merged;
}

export function saveProfile(file, profile, values) {
  const config = readConfig(file);
  config.profiles ||= {};
  config.profiles[profile] = { ...(config.profiles[profile] || {}), ...values };
  config.default_profile ||= profile;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return config.profiles[profile];
}
