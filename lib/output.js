function toYaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    return value.map(v => `${pad}- ${typeof v === 'object' && v !== null ? `\n${toYaml(v, indent + 2)}` : scalar(v)}`).join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => {
      if (typeof v === 'object' && v !== null) return `${pad}${k}:\n${toYaml(v, indent + 2)}`;
      return `${pad}${k}: ${scalar(v)}`;
    }).join('\n');
  }
  return scalar(value);
}

function scalar(v) {
  if (typeof v === 'string') return v.includes(':') || v.includes('\n') ? JSON.stringify(v) : v;
  return String(v);
}

export function format(payload, mode = 'table') {
  if (mode === 'json') return `${JSON.stringify(payload, null, 2)}\n`;
  if (mode === 'yaml') return `${toYaml(payload)}\n`;
  return `${human(payload)}\n`;
}

function human(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data.map(row => typeof row === 'object' ? Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('  ') : String(row)).join('\n');
  if (data && typeof data === 'object') return Object.entries(data).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
  return String(data ?? '');
}

export function errorPayload(err) {
  return { success: false, error: { code: err.code || err.name || 'Error', message: err.message, details: err.details || null } };
}
