import crypto from 'crypto';
import { logger, safeMeta } from '../utils/logger.js';

// Correlation middleware: adds a requestId, X-Request-Id header and a per-request log helper
export default function correlationId(req, res, next) {
  // Use crypto.randomUUID() when available, otherwise fallback
  const id = (crypto.randomUUID && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  res.locals.requestId = id;

  // attach a logger helper that always includes requestId and user info
  req.log = (level, event, meta = {}) => {
    const user = req.user ? { id: req.user.id } : null;
    logger.log({ level: level || 'info', message: event, requestId: id, user, ...safeMeta(meta) });
  };

  // small log for tracing
  logger.info('request_assigned_id', safeMeta({ requestId: id, method: req.method, url: req.originalUrl || req.url }));

  next();
}
