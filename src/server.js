import dotenv from 'dotenv';
import app from './app.js';
import prisma from './db/client.js';
import { startJobs } from './jobs/index.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

import http from 'http';
import { initSocket } from './services/socket.js';

// Start server
const httpServer = http.createServer(app);
initSocket(httpServer);

const server = httpServer.listen(PORT, async () => {
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('========================================\n');

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Start background jobs
  try {
    startJobs();
    console.log('✅ Background jobs started\n');
  } catch (error) {
    console.error('❌ Failed to start background jobs:', error.message);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  gracefulShutdown('UNHANDLED_REJECTION');
});

export default server;
