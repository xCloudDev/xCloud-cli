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
    'user revoke-token': ['DELETE', id => `/user/tokens/${id}`, true],
    'blueprints list': ['GET', '/blueprints'],
    'servers list': ['GET', '/servers'],
    'servers show': ['GET', id => `/servers/${id}`],
    'servers sites': ['GET', id => `/servers/${id}/sites`],
    'servers databases': ['GET', id => `/servers/${id}/databases`],
    'servers cron-jobs': ['GET', id => `/servers/${id}/cron-jobs`],
    'servers monitoring': ['GET', id => `/servers/${id}/monitoring`],
    'servers tasks': ['GET', id => `/servers/${id}/tasks`],
    'servers php-versions': ['GET', id => `/servers/${id}/php-versions`],
    'servers sudo-users': ['GET', id => `/servers/${id}/sudo-users`],
    'servers power-cycle': ['POST', id => `/servers/${id}/reboot`, true],
    'sites list': ['GET', '/sites'],
    'sites show': ['GET', id => `/sites/${id}`],
    'sites backups': ['GET', id => `/sites/${id}/backups`],
    'sites status': ['GET', id => `/sites/${id}/status`],
    'sites ssl': ['GET', id => `/sites/${id}/ssl`],
    'sites domain': ['GET', id => `/sites/${id}/domain`],
    'sites events': ['GET', id => `/sites/${id}/events`],
    'sites deployment-logs': ['GET', id => `/sites/${id}/deployment-logs`],
    'sites git': ['GET', id => `/sites/${id}/git`],
    'sites ssh': ['GET', id => `/sites/${id}/ssh`],
    'sites backup': ['POST', id => `/sites/${id}/backup`, true],
    'sites purge-cache': ['POST', id => `/sites/${id}/cache/purge`, true]
  },
  enterprise: {
    health: ['GET', '/health', false],
    'enterprise servers list': ['GET', '/servers'],
    'enterprise servers show': ['GET', id => `/server/${id}`],
    'enterprise servers create': ['POST', '/server', true],
    'enterprise servers update': ['PATCH', id => `/server/${id}`, true],
    'enterprise servers delete': ['DELETE', id => `/server/${id}`, true],
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
