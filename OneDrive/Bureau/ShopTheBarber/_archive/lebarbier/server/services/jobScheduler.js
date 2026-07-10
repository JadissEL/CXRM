import { PrivacyService } from './privacyService.js';
import { get, run, query } from '../database/db.js';

export class JobScheduler {
  static jobs = new Map();
  static isRunning = false;

  // Initialize the job scheduler
  static init() {
    if (this.isRunning) {
      console.log('Job scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('🕐 Job scheduler initialized');

    // Schedule recurring jobs
    this.scheduleJob('cleanup-expired-exports', '0 2 * * *', this.cleanupExpiredExports); // Daily at 2 AM
    this.scheduleJob('process-scheduled-deletions', '0 3 * * *', this.processScheduledDeletions); // Daily at 3 AM
    this.scheduleJob('cleanup-old-logs', '0 4 * * *', this.cleanupOldLogs); // Daily at 4 AM
    this.scheduleJob('cleanup-old-sessions', '0 5 * * *', this.cleanupOldSessions); // Daily at 5 AM

    // Start the scheduler
    this.startScheduler();
  }

  // Schedule a job
  static scheduleJob(name, cronExpression, jobFunction) {
    this.jobs.set(name, {
      cronExpression,
      jobFunction,
      lastRun: null,
      nextRun: this.calculateNextRun(cronExpression)
    });
    console.log(`📅 Scheduled job: ${name} - ${cronExpression}`);
  }

  // Calculate next run time based on cron expression
  static calculateNextRun(cronExpression) {
    // Simple cron parser for basic expressions (minute hour day month dayOfWeek)
    const parts = cronExpression.split(' ');
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    const now = new Date();
    let nextRun = new Date(now);
    
    // Set to next occurrence
    if (minute !== '*') {
      nextRun.setMinutes(parseInt(minute));
      if (nextRun <= now) {
        nextRun.setHours(nextRun.getHours() + 1);
      }
    }
    
    if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    }
    
    return nextRun;
  }

  // Start the scheduler
  static startScheduler() {
    setInterval(() => {
      this.checkAndRunJobs();
    }, 60000); // Check every minute

    console.log('🚀 Job scheduler started');
  }

  // Check and run jobs
  static async checkAndRunJobs() {
    const now = new Date();
    
    for (const [jobName, job] of this.jobs) {
      if (job.nextRun && job.nextRun <= now) {
        try {
          console.log(`🔄 Running job: ${jobName}`);
          await job.jobFunction();
          job.lastRun = now;
          job.nextRun = this.calculateNextRun(job.cronExpression);
          console.log(`✅ Job completed: ${jobName}`);
        } catch (error) {
          console.error(`❌ Job failed: ${jobName}`, error);
        }
      }
    }
  }

  // Cleanup expired exports
  static async cleanupExpiredExports() {
    try {
      const result = await PrivacyService.cleanupExpiredExports();
      console.log(`🧹 Cleaned up ${result.cleaned} expired exports`);
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
    }
  }

  // Process scheduled deletions
  static async processScheduledDeletions() {
    try {
      const scheduledDeletions = await PrivacyService.getScheduledDeletions();
      let processed = 0;

      for (const deletion of scheduledDeletions) {
        try {
          await PrivacyService.processAccountDeletion(deletion.user_id);
          processed++;
          console.log(`🗑️ Processed account deletion for user ${deletion.user_id}`);
        } catch (error) {
          console.error(`Error processing deletion for user ${deletion.user_id}:`, error);
        }
      }

      if (processed > 0) {
        console.log(`🗑️ Processed ${processed} account deletions`);
      }
    } catch (error) {
      console.error('Error processing scheduled deletions:', error);
    }
  }

  // Cleanup old logs
  static async cleanupOldLogs() {
    try {
      // Get retention policy for logs
      const policy = await get(
        "SELECT retention_period_days FROM data_retention_policies WHERE data_type = 'logs'"
      );

      if (!policy) {
        console.log('No retention policy found for logs');
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period_days);

      // Clean up old data access logs
      const result = await run(
        "DELETE FROM data_access_logs WHERE created_at < ?",
        [cutoffDate.toISOString()]
      );

      console.log(`🧹 Cleaned up ${result.changes} old log entries`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  // Cleanup old sessions
  static async cleanupOldSessions() {
    try {
      const result = await run(
        "DELETE FROM user_sessions WHERE expires_at < datetime('now')"
      );

      console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
    } catch (error) {
      console.error('Error cleaning up old sessions:', error);
    }
  }

  // Run a job immediately
  static async runJobNow(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job ${jobName} not found`);
    }

    try {
      console.log(`🔄 Running job immediately: ${jobName}`);
      await job.jobFunction();
      job.lastRun = new Date();
      console.log(`✅ Job completed: ${jobName}`);
    } catch (error) {
      console.error(`❌ Job failed: ${jobName}`, error);
      throw error;
    }
  }

  // Get job status
  static getJobStatus() {
    const status = {};
    for (const [jobName, job] of this.jobs) {
      status[jobName] = {
        lastRun: job.lastRun,
        nextRun: job.nextRun,
        cronExpression: job.cronExpression
      };
    }
    return status;
  }

  // Stop the scheduler
  static stop() {
    this.isRunning = false;
    console.log('🛑 Job scheduler stopped');
  }
} 