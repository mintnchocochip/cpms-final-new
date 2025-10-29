import { logger, safeMeta, redact, safeStringifyWithLimit } from '../utils/logger.js';

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
  // capture response body by wrapping res.send
  let responseBody = null;
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    try {
      responseBody = body;
    } catch (e) {
      responseBody = '[unserializable]';
    }
    return originalSend(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;

    // prepare request details with redaction and limits
    const requestDetails = {
      headers: redact(Object.fromEntries(Object.entries(req.headers || {}).map(([k,v]) => [k, String(v)]))),
      params: redact(req.params || {}),
      query: redact(req.query || {}),
      body: redact(req.body || {}),
    };

    // prepare response details (if JSON/string) with limits
    let responseDetails;
    try {
      if (responseBody === null) {
        responseDetails = { note: 'no_body_captured' };
      } else if (typeof responseBody === 'string') {
        responseDetails = { body: responseBody.length > 100000 ? `${responseBody.slice(0,100000)}... (truncated)` : responseBody };
      } else if (typeof responseBody === 'object') {
        responseDetails = { body: redact(responseBody) };
      } else {
        responseDetails = { body: String(responseBody) };
      }
    } catch (e) {
      responseDetails = { note: 'error_serializing_response' };
    }

    logger.info('request_complete', safeMeta({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: duration,
      user,
      request: requestDetails,
      response: responseDetails,
    }));
  });

  next();
}
