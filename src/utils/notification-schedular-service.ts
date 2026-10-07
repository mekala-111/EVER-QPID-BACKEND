import { IPushNotification } from "../models/push-notification/push-notification-model";
import { pushNotificationRepository, userRepository } from "../repositories";
import * as cron from "node-cron";
import FirebaseService from "./firebase-service";

const timeZone = "Asia/Kolkata";

// Keep jobs in memory
const scheduledJobs: Record<string, cron.ScheduledTask> = {};

/**
 * Initialize scheduler (CALL ON SERVER START)
 */
async function notificationSchedular(): Promise<void> {
    try {
        const notifications =
            await pushNotificationRepository.getAllActiveNotifications();

        if (!notifications?.length) {
            console.log("ℹ️ No active notifications");
            return;
        }

        notifications.forEach(scheduleNotification);
    } catch (error) {
        console.error("❌ Scheduler init error:", error);
    }
}

/**
 * Schedule a single notification
 */
const scheduleNotification = (notification: IPushNotification): void => {
    if (!notification?._id) return;

    const jobId = notification._id.toString();
    const { time, fromDate, toDate, interval, paused } = notification;

    // Pause handling
    if (paused) {
        stopJob(jobId);
        console.log(`⏸ Notification ${jobId} paused`);
        return;
    }

    const now = new Date();

    // Date range validation
    if (
        new Date(fromDate) > now ||
        (toDate && new Date(toDate) < now)
    ) {
        console.log(`⛔ Notification ${jobId} outside date range`);
        return;
    }

    // Time parsing
    const [hour, minute] = time.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) {
        console.error(`❌ Invalid time format for ${jobId}`);
        return;
    }

    // ✅ ALWAYS RUN DAILY
    const cronExpression = `0 ${minute} ${hour} * * *`;

    // Replace existing job
    stopJob(jobId);

    scheduledJobs[jobId] = cron.schedule(
        cronExpression,
        async () => {
            console.log("⏰ CRON FIRED →", jobId, new Date());

            try {
                const now = new Date();

                // Expiry check
                if (toDate && new Date(toDate) < now) {
                    console.log(`⌛ Notification ${jobId} expired`);
                    stopJob(jobId);
                    return;
                }

                // Interval logic (CRITICAL FIX)
                const diffDays = Math.floor(
                    (now.getTime() - new Date(fromDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                // interval = 1 → every 2 days
                if (
                    interval > 0 &&
                    diffDays % (interval + 1) !== 0
                ) {
                    console.log(`⏭ Skipped today (interval rule)`);
                    return;
                }

                await sendNotification(notification);
            } catch (err) {
                console.error("❌ Cron execution error:", err);
            }
        },
        {
            scheduled: true,
            timezone: timeZone,
        }
    );

    console.log(
        `✅ Notification ${jobId} scheduled → ${cronExpression}`
    );
};


const sendNotification = async (notification: IPushNotification) => {
  let recipientTokens: string[] = [];

  const { recipients } = notification;

  for (const target of recipients) {
    switch (target) {
      case 'All_Users':
        recipientTokens.push(...(await userRepository.getFCMTokens('all')));
        break;

      case 'Male_Users':
        recipientTokens.push(...(await userRepository.getFCMTokensByGender('Man')));
        break;

      case 'Female_Users':
        recipientTokens.push(...(await userRepository.getFCMTokensByGender('Women')));
        break;

      case 'New_Users':
        recipientTokens.push(...(await userRepository.getFCMTokensForNewUsers()));
        break;

      case 'Users_not_Subscribed':
        recipientTokens.push(...(await userRepository.getFCMTokensNotSubscribed()));
        break;

      case 'Users_with_expiring_plan':
        recipientTokens.push(...(await userRepository.getFCMTokensWithExpiringPlan()));
        break;
    }
  }

  // Remove duplicates
  recipientTokens = [...new Set(recipientTokens)];

  if (!recipientTokens.length) {
    console.log('No FCM tokens found. Push not sent.');
    return;
  }

  const firebaseService = new FirebaseService();
  await firebaseService.sendPushNotification(recipientTokens, notification.title, notification.description, notification.link, notification.imageUrl);
};

/**
 * Remove scheduled notification
 */
const removeNotification = (notification: IPushNotification): void => {
    if (!notification?._id) return;

    const jobId = notification._id.toString();
    stopJob(jobId);

    console.log(`🗑 Notification ${jobId} removed`);
};

/**
 * Stop & delete cron job
 */
const stopJob = (jobId: string): void => {
    if (scheduledJobs[jobId]) {
        scheduledJobs[jobId].stop();
        delete scheduledJobs[jobId];
    }
};

export { notificationSchedular, scheduleNotification, removeNotification };
