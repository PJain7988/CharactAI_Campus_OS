require('dotenv').config();
const app    = require('./app');
const logger = require('./config/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`✅ CharactAI API started on http://${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully…`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit if close takes more than 10s
  setTimeout(() => {
    logger.error('Could not close connections in time — forcing exit');
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// ── Unhandled Rejections ──────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error({ message: 'Unhandled Promise Rejection', reason });
});

process.on('uncaughtException', (err) => {
  logger.error({ message: 'Uncaught Exception', error: err.message, stack: err.stack });
  process.exit(1);
});
