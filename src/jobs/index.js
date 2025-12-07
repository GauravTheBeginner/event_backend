import { scheduleCleanupJob } from './cleanupChats.job.js';
import { scheduleScraperJob } from './eventScrapper.js';

// Initialize all background jobs
export const startJobs = () => {
  console.log('🔄 Initializing background jobs...');
  
  // Start chat cleanup job
  scheduleCleanupJob();
  
  // Start event scraper job
  scheduleScraperJob();
  
  // Add more jobs here as needed
  // e.g., scheduleEmailNotifications();
  // e.g., scheduleDataBackup();
  
  console.log('✅ All background jobs initialized');
};

export default startJobs;
