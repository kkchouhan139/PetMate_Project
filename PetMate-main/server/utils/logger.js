const redact = (value) => {
  if (!value) return value;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str
    .replace(/(password|token|jwt|api_key|apiKey|secret|authorization)\s*[:=]\s*["']?[^"'\s]+/gi, '$1:[REDACTED]')
    .replace(/([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi, '[REDACTED_EMAIL]');
};

const log = (level, message, meta) => {
  const safeMessage = redact(message);
  const safeMeta = meta ? redact(meta) : undefined;
  const payload = safeMeta ? `${safeMessage} ${safeMeta}` : safeMessage;
  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else {
    console.log(payload);
  }
};

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta)
};
