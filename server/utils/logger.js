import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize, json, splat } = format;

// ensure logs directory exists
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Human friendly console format
const consoleFormat = combine(
  colorize(),
  timestamp(),
  splat(),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// JSON file format for structured logs (easy to parse/filter)
const fileFormat = combine(timestamp(), splat(), json());

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new transports.Console({ format: consoleFormat }),
    // write structured logs to a file for audits and parsing
    new transports.File({ filename: 'logs/combined.log', format: fileFormat }),
    new transports.File({ filename: 'logs/error.log', level: 'error', format: fileFormat }),
  ],
  exitOnError: false,
});

// helper to safely stringify potentially large objects for console
function safeMeta(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (_) {
    return { note: 'unserializable_meta' };
  }
}

// redact sensitive keys from objects (recursive)
function redact(obj, keys = ['password', 'pwd', 'token', 'accessToken', 'refreshToken', 'authorization', 'auth']) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    try {
      if (keys.includes(k.toString().toLowerCase())) {
        result[k] = 'REDACTED';
        continue;
      }

      if (v && typeof v === 'object') {
        result[k] = redact(v, keys);
      } else {
        result[k] = v;
      }
    } catch (e) {
      result[k] = 'UNSERIALIZABLE';
    }
  }
  return result;
}

// safely stringify with size limit to avoid logging extremely large payloads
function safeStringifyWithLimit(obj, maxChars = 100000) {
  try {
    const str = JSON.stringify(obj);
    if (str.length > maxChars) {
      return `${str.slice(0, maxChars)}... (truncated, total ${str.length} chars)`;
    }
    return str;
  } catch (e) {
    return '[unserializable]';
  }
}

export { logger, safeMeta };
export { redact, safeStringifyWithLimit };

export default logger;
