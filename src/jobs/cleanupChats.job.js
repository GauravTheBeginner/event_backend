import cron from 'node-cron';
import prisma from '../db/client.js';

// Cleanup expired event chats
export const cleanupExpiredChats = async () => {
  console.log('[Cleanup Job] Starting expired chat cleanup...');
  
  try {
    const now = new Date();
    
    // Find expired chats
    const expiredChats = await prisma.eventChat.findMany({
      where: {
        expiresAt: {
          lt: now
        }
      },
      select: {
        id: true,
        chatId: true,
        eventName: true,
        expiresAt: true
      }
    });

    if (expiredChats.length === 0) {
      console.log('[Cleanup Job] No expired chats found');
      return;
    }

    console.log(`[Cleanup Job] Found ${expiredChats.length} expired chat(s)`);

    // Delete expired chats (cascade will delete messages and members)
    const chatIds = expiredChats.map(chat => chat.id);
    
    const result = await prisma.eventChat.deleteMany({
      where: {
        id: {
          in: chatIds
        }
      }
    });

    console.log(`[Cleanup Job] Successfully deleted ${result.count} expired chat(s)`);
    expiredChats.forEach(chat => {
      console.log(`  - Deleted: ${chat.chatId} (${chat.eventName}) - Expired at: ${chat.expiresAt}`);
    });
  } catch (error) {
    console.error('[Cleanup Job] Error during cleanup:', error);
  }
};

// Schedule cleanup job to run every 10 minutes
export const scheduleCleanupJob = () => {
  // Run every 10 minutes: */10 * * * *
  // For testing, you can use '*/1 * * * *' to run every minute
  const schedule = '*/10 * * * *';
  
  cron.schedule(schedule, cleanupExpiredChats, {
    timezone: process.env.TZ || 'UTC'
  });
  
  console.log(`[Cleanup Job] Scheduled to run every 10 minutes`);
  
  // Run immediately on startup
  cleanupExpiredChats().catch(error => {
    console.error('[Cleanup Job] Initial cleanup failed:', error);
  });
};

export default scheduleCleanupJob;
