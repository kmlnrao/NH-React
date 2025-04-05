import { storage } from "./storage";
import { ComplianceTask, Notification, insertNotificationSchema } from "@shared/schema";

// Scheduler configuration
const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Function to process due tasks and create notifications
async function processTasks() {
  try {
    console.log("Running scheduled task processing...");
    
    // Get tasks due soon (next 7 days) that need notifications
    console.log("Checking for tasks due soon...");
    const dueSoonTasks = await storage.getTasksDueSoon(7);
    console.log(`Found ${dueSoonTasks.length} tasks due soon`);
    
    for (const task of dueSoonTasks) {
      try {
        await createNotificationForTask(task, "upcoming");
      } catch (taskError) {
        console.error(`Error processing due soon task ${task.id}:`, taskError);
        // Continue with next task
      }
    }

    // Get overdue tasks that need escalation
    console.log("Checking for overdue tasks...");
    const overdueTasks = await storage.getOverdueTasks();
    console.log(`Found ${overdueTasks.length} overdue tasks`);
    
    for (const task of overdueTasks) {
      try {
        await createNotificationForTask(task, "overdue");
      } catch (taskError) {
        console.error(`Error processing overdue task ${task.id}:`, taskError);
        // Continue with next task
      }
    }

    console.log(`Task scheduler ran: Processed ${dueSoonTasks.length} upcoming tasks and ${overdueTasks.length} overdue tasks`);
  } catch (error) {
    console.error("Error in task scheduler:", error);
  }
}

// Function to create a notification for a task
async function createNotificationForTask(task: ComplianceTask, status: "upcoming" | "overdue") {
  // Skip if we've already sent a notification for this task with the same status in the last 24 hours
  const existingNotifications = await storage.getNotificationsByTask(task.id);
  const recentNotification = existingNotifications.find(n => {
    const createdAt = new Date(n.createdAt);
    const now = new Date();
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreated < 24 && n.status !== "actioned";
  });

  if (recentNotification) {
    return; // Skip sending another notification
  }

  if (!task.assignedTo) {
    console.warn(`Task ${task.id} has no assigned user, skipping notification`);
    return;
  }

  // Get user notification settings
  const userSettings = await storage.getNotificationSettings(task.assignedTo);
  const taskTypeSettings = userSettings.find(s => s.notificationType === task.type);

  if (!taskTypeSettings) {
    // Create default settings if none exist
    await storage.createNotificationSettings({
      userId: task.assignedTo,
      notificationType: task.type,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      whatsappEnabled: false,
      reminderDays: 7,
    });
  }

  // Prepare channels based on user settings
  const channels = [];
  if (taskTypeSettings?.emailEnabled) channels.push("email");
  if (taskTypeSettings?.smsEnabled) channels.push("sms");
  if (taskTypeSettings?.pushEnabled) channels.push("push");
  if (taskTypeSettings?.whatsappEnabled) channels.push("whatsapp");
  
  // Always add dashboard
  if (!channels.includes("dashboard")) {
    channels.push("dashboard");
  }

  // Create notification
  let title, message, priority;
  const dueDate = new Date(task.dueDate).toLocaleDateString();

  if (status === "upcoming") {
    title = `${task.type.charAt(0).toUpperCase() + task.type.slice(1)} - ${task.title}`;
    message = `${task.title} is due on ${dueDate}. ${task.description}`;
    priority = task.priority;
  } else {
    title = `OVERDUE: ${task.title}`;
    message = `${task.title} was due on ${dueDate} and is now overdue. ${task.description}`;
    priority = "high"; // Escalate priority for overdue tasks
  }

  // Create notification object
  const notificationData = {
    userId: task.assignedTo,
    taskId: task.id,
    title,
    message,
    type: task.type as any,
    status: "pending" as any,
    priority: priority as any,
    channels,
    scheduledAt: new Date(),
    escalationLevel: 0,
  };

  // Insert notification
  const notification = await storage.createNotification(notificationData);

  // Log the notification creation
  await storage.createNotificationLog({
    notificationId: notification.id,
    userId: task.assignedTo,
    status: "sent" as any,
    channel: "dashboard",
  });

  // Handle escalation for overdue tasks
  if (status === "overdue") {
    await handleEscalation(task, notification);
  }

  return notification;
}

// Function to handle escalation for overdue tasks
async function handleEscalation(task: ComplianceTask, notification: Notification) {
  const daysOverdue = Math.floor(
    (new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Get escalation levels for this task type
  const escalationLevels = await storage.getEscalationLevelsByType(task.type);
  
  // Sort by days before escalation ascending
  escalationLevels.sort((a, b) => a.daysBeforeEscalation - b.daysBeforeEscalation);
  
  // Find the appropriate escalation level
  const escalationLevel = escalationLevels.find(
    level => daysOverdue >= level.daysBeforeEscalation
  );
  
  if (escalationLevel) {
    // Create an escalation notification for the escalation recipient
    const escalationData = {
      userId: escalationLevel.userId,
      taskId: task.id,
      title: `ESCALATION: ${task.title}`,
      message: `Task "${task.title}" is ${daysOverdue} days overdue. This has been escalated to you as level ${escalationLevel.level} escalation contact.`,
      type: "escalation" as any,
      status: "pending" as any,
      priority: "critical" as any,
      channels: [] as string[], // Will be populated based on escalation settings
      scheduledAt: new Date(),
      escalationLevel: escalationLevel.level,
      escalatedTo: escalationLevel.userId,
    };
    
    // Add channels based on escalation settings
    if (escalationLevel.emailEnabled) escalationData.channels.push("email");
    if (escalationLevel.smsEnabled) escalationData.channels.push("sms");
    if (escalationLevel.pushEnabled) escalationData.channels.push("push");
    if (escalationLevel.whatsappEnabled) escalationData.channels.push("whatsapp");
    if (!escalationData.channels.includes("dashboard")) {
      escalationData.channels.push("dashboard");
    }
    
    // Create the escalation notification
    const escalationNotification = await storage.createNotification(escalationData);
    
    // Log the escalation notification
    await storage.createNotificationLog({
      notificationId: escalationNotification.id,
      userId: escalationLevel.userId,
      status: "sent" as any,
      channel: "dashboard",
      metadata: {
        escalationLevel: escalationLevel.level,
        daysOverdue,
        originalTaskAssignee: task.assignedTo,
      },
    });
    
    // Update the original notification with escalation info
    await storage.updateNotification(notification.id, {
      escalationLevel: escalationLevel.level,
      escalatedTo: escalationLevel.userId,
    });
  }
}

let taskScheduler: NodeJS.Timeout | null = null;

// Function to set up the task scheduler
export function setupTaskScheduler() {
  // Set up interval for task processing, but don't run immediately to allow DB connection to be established
  if (!taskScheduler) {
    // Delay the first run by 10 seconds to allow database connections to establish
    setTimeout(() => {
      // Try to run the task processor
      try {
        processTasks();
      } catch (error) {
        console.error("Error in initial task processing:", error);
      }
      
      // Then set up the recurring interval
      taskScheduler = setInterval(() => {
        try {
          processTasks();
        } catch (error) {
          console.error("Error in scheduled task processing:", error);
        }
      }, CHECK_INTERVAL);
      
      console.log("Task scheduler initialized");
    }, 10000); // 10 second delay
  }
}

// Function to stop the task scheduler (for cleanup)
export function stopTaskScheduler() {
  if (taskScheduler) {
    clearInterval(taskScheduler);
    taskScheduler = null;
    console.log("Task scheduler stopped");
  }
}
