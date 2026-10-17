import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`=========================================`);
      console.log(` NovaStore Backend Server Running!`);
      console.log(` Environment : ${env.NODE_ENV}`);
      console.log(` Port        : ${env.PORT}`);
      console.log(` API Base    : /api/v1`);
      console.log(` Client URL  : ${env.CLIENT_URL}`);
      console.log(`=========================================`);
    });

    server.headersTimeout = 65000;
    server.requestTimeout = 120000;
    server.keepAliveTimeout = 5000;

    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

      const forceShutdown = setTimeout(() => {
        console.error('[Server] Shutdown timed out; forcing process exit.');
        process.exit(1);
      }, 30000);
      forceShutdown.unref();

      try {
        await new Promise((resolve, reject) => {
          server.close(error => (error ? reject(error) : resolve()));
        });
        await disconnectDB();
        clearTimeout(forceShutdown);
        console.log('[Server] Process terminated.');
        process.exitCode = 0;
      } catch (error) {
        clearTimeout(forceShutdown);
        console.error('[Server] Graceful shutdown failed:', error);
        process.exitCode = 1;
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    console.error('[Server] Fatal error during startup:', error);
    process.exit(1);
  }
};

startServer();
