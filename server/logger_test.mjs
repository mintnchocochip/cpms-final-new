import logger from './utils/logger.js';

async function test() {
  logger.info('logger_test_start', { test: true });
  logger.warn('logger_test_warn', { reason: 'just-testing' });
  logger.error('logger_test_error', { error: 'none' });
  // allow transports to flush
  setTimeout(() => process.exit(0), 200);
}

test();
