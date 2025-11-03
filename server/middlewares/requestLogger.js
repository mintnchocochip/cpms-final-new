import { logger, safeMeta } from '../utils/logger.js';

export default function requestLogger(req, res, next) {
  const start = Date.now();
  const user = req.user ? { id: req.user.id, email: req.user.emailId || null } : null;
  const requestId = req.requestId || res.locals.requestId || null;

  // Log basic request info (include requestId if present)
  logger.info('incoming_request', safeMeta({
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    user,
    ip: req.ip || req.headers['x-forwarded-for'] || null,
    ua: req.get('user-agent') || null,
    bodySummary: Object.keys(req.body || {}).length ? Object.keys(req.body).slice(0,10) : [],
  }));

  // Hook response finish to log timing and status
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('request_complete', safeMeta({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      user,
    }));
  });

  next();
}
