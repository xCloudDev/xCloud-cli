export const PUBLIC_BASE = '/api/v1';
export const ENTERPRISE_BASE = '/api/enterprise/v1.0';

export function apiPrefix(flavor = 'public') {
  return flavor === 'enterprise' ? ENTERPRISE_BASE : PUBLIC_BASE;
}

export const routes = {
  public: {
    health: ['GET', '/health', false],
    'user show': ['GET', '/user'],
    'user tokens': ['GET', '/user/tokens'],
    'user revoke-token': ['DELETE', tokenId => `/user/tokens/${tokenId}`, true],
    'integrations cloudflare': ['GET', '/integrations/cloudflare'],
    'blueprints list': ['GET', '/blueprints'],
    'servers list': ['GET', '/servers'],
    'servers show': ['GET', serverId => `/servers/${serverId}`],
    'servers sites': ['GET', serverId => `/servers/${serverId}/sites`],
    'servers databases': ['GET', serverId => `/servers/${serverId}/databases`],
    'servers cron-jobs': ['GET', serverId => `/servers/${serverId}/cron-jobs`],
    'servers monitoring': ['GET', serverId => `/servers/${serverId}/monitoring`],
    'servers tasks': ['GET', serverId => `/servers/${serverId}/tasks`],
    'servers php-versions': ['GET', serverId => `/servers/${serverId}/php-versions`],
    'servers sudo-users': ['GET', serverId => `/servers/${serverId}/sudo-users`],
    'servers create-sudo-user': ['POST', serverId => `/servers/${serverId}/sudo-users`, true],
    'servers delete-sudo-user': ['DELETE', (serverId, sudoUserId) => `/servers/${serverId}/sudo-users/${sudoUserId}`, true],
    'servers create-wordpress-site': ['POST', serverId => `/servers/${serverId}/sites/wordpress`, true],
    'servers power-cycle': ['POST', serverId => `/servers/${serverId}/reboot`, true],
    'sites list': ['GET', '/sites'],
    'sites show': ['GET', siteId => `/sites/${siteId}`],
    'sites backups': ['GET', siteId => `/sites/${siteId}/backups`],
    'sites status': ['GET', siteId => `/sites/${siteId}/status`],
    'sites ssl': ['GET', siteId => `/sites/${siteId}/ssl`],
    'sites domain': ['GET', siteId => `/sites/${siteId}/domain`],
    'sites monitoring': ['GET', siteId => `/sites/${siteId}/monitoring`],
    'sites events': ['GET', siteId => `/sites/${siteId}/events`],
    'sites deployment-logs': ['GET', siteId => `/sites/${siteId}/deployment-logs`],
    'sites git': ['GET', siteId => `/sites/${siteId}/git`],
    'sites ssh': ['GET', siteId => `/sites/${siteId}/ssh`],
    'sites update-ssh': ['PUT', siteId => `/sites/${siteId}/ssh`, true],
    'sites backup': ['POST', siteId => `/sites/${siteId}/backup`, true],
    'sites purge-cache': ['POST', siteId => `/sites/${siteId}/cache/purge`, true]
  },
  enterprise: {
    health: ['GET', '/health', false],
    'enterprise servers list': ['GET', '/servers'],
    'enterprise servers show': ['GET', serverId => `/server/${serverId}`],
    'enterprise servers create': ['POST', '/server', true],
    'enterprise servers update': ['PATCH', serverId => `/server/${serverId}`, true],
    'enterprise servers delete': ['DELETE', serverId => `/server/${serverId}`, true],
    'enterprise sites list': ['GET', '/sites'],
    'enterprise sites show': ['GET', siteId => `/site/${siteId}`],
    'enterprise sites create': ['POST', '/site', true],
    'enterprise sites update': ['PUT', siteId => `/site/${siteId}`, true],
    'enterprise sites delete': ['DELETE', siteId => `/site/${siteId}`, true],
    'enterprise sites suspend': ['POST', siteId => `/site/${siteId}/suspend`, true],
    'enterprise sites staging': ['POST', siteId => `/site/${siteId}/staging`, true],
    'enterprise sites publish-staging': ['POST', siteId => `/site/${siteId}/staging/publish`, true],
    'enterprise sites purge-cache': ['POST', siteId => `/site/${siteId}/cache/purge`, true],
    'enterprise sites ssh-keys': ['GET', siteId => `/site/${siteId}/ssh-keys`],
    'enterprise sites create-ssh-key': ['POST', siteId => `/site/${siteId}/ssh-keys`, true],
    'enterprise users list': ['GET', '/users'],
    'enterprise users show': ['GET', id => `/user/${id}`],
    'enterprise users create': ['POST', '/user', true],
    'enterprise users update': ['PATCH', id => `/user/${id}`, true],
    'enterprise users delete': ['DELETE', id => `/user/${id}`, true],
    'enterprise users get-auth-token': ['GET', id => `/user/${id}/get-auth-token`],
    'enterprise addon email products': ['GET', '/addon/email/products'],
    'enterprise addon email provider': ['GET', '/addon/email/provider'],
    'enterprise addon email purchase': ['POST', '/addon/email/purchase', true],
    'enterprise addon mailbox products': ['GET', '/addon/mailbox/products'],
    'enterprise addon mailbox accounts': ['GET', '/addon/mailbox/accounts'],
    'enterprise addon mailbox show': ['GET', id => `/addon/mailbox/${id}`],
    'enterprise addon mailbox purchase': ['POST', '/addon/mailbox/purchase', true],
    'enterprise addon mailbox update': ['PATCH', id => `/addon/mailbox/${id}`, true],
    'enterprise addon mailbox delete': ['DELETE', id => `/addon/mailbox/${id}`, true],
    'enterprise addon patchstack products': ['GET', '/addon/patchstack/products'],
    'enterprise addon patchstack sites': ['GET', '/addon/patchstack/sites'],
    'enterprise addon patchstack show': ['GET', id => `/addon/patchstack/${id}`],
    'enterprise addon patchstack purchase': ['POST', '/addon/patchstack/purchase', true],
    'enterprise addon patchstack delete': ['DELETE', id => `/addon/patchstack/${id}`, true]
  }
};

export function resolveRoute(flavor, words) {
  const table = flavor === 'enterprise' ? routes.enterprise : routes.public;
  for (let i = words.length; i > 0; i--) {
    const key = words.slice(0, i).join(' ');
    if (table[key]) return { route: table[key], params: words.slice(i), key };
  }
  return null;
}

export function buildRoutePath(route, params = [], key = 'command') {
  const target = route[1];
  if (typeof target !== 'function') {
    if (params.length) throw new Error(`unexpected argument(s) for command: ${key}`);
    return target;
  }

  const required = target.length;
  if (params.length < required) {
    const suffix = required === 1 ? 'id' : `${required} ids`;
    throw new Error(`missing required ${suffix} for command: ${key}`);
  }
  if (params.length > required) throw new Error(`unexpected argument(s) for command: ${key}`);
  return target(...params);
}

export function buildURL(baseURL, flavor, path, query = []) {
  const cleanBase = String(baseURL || '').replace(/\/+$/, '');
  const prefix = apiPrefix(flavor).replace(/^\/+|\/+$/g, '');
  const cleanPath = String(path || '').replace(/^\/+/, '');
  const url = new URL(`${cleanBase}/${prefix}/${cleanPath}`);
  for (const pair of query) {
    const idx = pair.indexOf('=');
    if (idx === -1) url.searchParams.append(pair, '');
    else url.searchParams.append(pair.slice(0, idx), pair.slice(idx + 1));
  }
  return url.toString();
}
