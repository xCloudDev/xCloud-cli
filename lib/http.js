export class XcloudError extends Error {
  constructor(message, code = 'XcloudError', status = 1, details = null) {
    super(message);
    this.name = code;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function makeHeaders(token) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'xcloud-cli/0.1.0' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function requestJSON(url, { method = 'GET', token = '', data = undefined, fetchImpl = fetch } = {}) {
  const init = { method, headers: makeHeaders(token) };
  if (data !== undefined && method !== 'GET') init.body = typeof data === 'string' ? data : JSON.stringify(data);
  const res = await fetchImpl(url, init);
  const text = await res.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw new XcloudError(`HTTP ${res.status}`, 'HttpError', 2, { status: res.status, body });
  }
  return { status: res.status, data: body };
}
