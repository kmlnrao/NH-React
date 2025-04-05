import { db } from "../../server/db";
import { 
  users, 
  complianceTasks, 
  notificationSettings, 
  escalationLevels,
  messageTemplates
} from "../shared/schema";
import { hashPassword } from "../server/auth-utils";

/**
 * This file contains seed data to populate the database with initial data.
 * It should be run once during application setup.
 * 
 * Usage:
 * 1. Import this file in your setup script
 * 2. Call seedDatabase() function
 */

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Create default admin user
  const adminPassword = await hashPassword("admin123");
  const [admin] = await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    email: "admin@compliance.com",
    fullName: "System Administrator",
    role: "admin",
    department: "IT",
  }).returning();
  
  console.log(`Created admin user with ID ${admin.id}`);

  // Create a manager
  const managerPassword = await hashPassword("manager123");
  const [manager] = await db.insert(users).values({
    username: "sarah.johnson",
    password: managerPassword,
    email: "sarah.johnson@compliance.com",
    fullName: "Sarah Johnson",
    role: "manager",
    department: "Finance",
  }).returning();
  
  console.log(`Created manager user with ID ${manager.id}`);

  // Create a team lead
  const teamLeadPassword = await hashPassword("teamlead123");
  const [teamLead] = await db.insert(users).values({
    username: "rajesh.kumar",
    password: teamLeadPassword,
    email: "rajesh.kumar@compliance.com",
    fullName: "Rajesh Kumar",
    role: "team_lead",
    department: "Finance",
  }).returning();
  
  console.log(`Created team lead user with ID ${teamLead.id}`);

  // Create a regular user
  const userPassword = await hashPassword("user123");
  const [regularUser] = await db.insert(users).values({
    username: "john.doe",
    password: userPassword,
    email: "john.doe@compliance.com",
    fullName: "John Doe",
    role: "user",
    department: "Finance",
  }).returning();
  
  console.log(`Created regular user with ID ${regularUser.id}`);

  // Create notification settings for users
  const notificationTypes = ["statutory", "payment", "task", "escalation"];
  
  for (const user of [admin, manager, teamLead, regularUser]) {
    for (const type of notificationTypes) {
      await db.insert(notificationSettings).values({
        userId: user.id,
        notificationType: type as any,
        emailEnabled: true,
        smsEnabled: type === "escalation", // Only enable SMS for escalations
        pushEnabled: true,
        whatsappEnabled: false,
        reminderDays: type === "statutory" ? 7 : type === "payment" ? 3 : type === "task" ? 1 : 30,
      });
    }
  }
  
  console.log("Created notification settings for all users");

  // Create escalation levels
  await db.insert(escalationLevels).values([
    {
      level: 1,
      userId: teamLead.id,
      notificationType: "statutory",
      daysBeforeEscalation: 1,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
    {
      level: 2,
      userId: manager.id,
      notificationType: "statutory",
      daysBeforeEscalation: 3,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
    {
      level: 1,
      userId: teamLead.id,
      notificationType: "payment",
      daysBeforeEscalation: 1,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
    {
      level: 2,
      userId: manager.id,
      notificationType: "payment",
      daysBeforeEscalation: 2,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
    {
      level: 1,
      userId: teamLead.id,
      notificationType: "task",
      daysBeforeEscalation: 2,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
    {
      level: 1,
      userId: manager.id,
      notificationType: "escalation",
      daysBeforeEscalation: 3,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      whatsappEnabled: false,
      requiresAction: true,
    },
  ]);
  
  console.log("Created escalation levels");

  // Create message templates
  await db.insert(messageTemplates).values([
    {
      name: "Default Payment Reminder",
      type: "payment",
      template: "[Payment Type] payment of [Amount] is due on [Due Date]. Please process the payment to avoid penalties.",
      createdBy: admin.id,
    },
    {
      name: "Default Statutory Reminder",
      type: "statutory",
      template: "Reminder: [Compliance Type] filing deadline is [Due Date]. Please prepare the necessary documents.",
      createdBy: admin.id,
    },
    {
      name: "Default Task Reminder",
      type: "task",
      template: "Task [Task Name] is due on [Due Date]. [Task Description]",
      createdBy: admin.id,
    },
    {
      name: "Default Escalation",
      type: "escalation",
      template: "ESCALATION: [Task Name] is [Days] days overdue. This has been escalated to you as level [Level] escalation contact.",
      createdBy: admin.id,
    },
  ]);
  
  console.log("Created message templates");

  // Create sample compliance tasks with various due dates
  const currentDate = new Date();
  
  // Task due today
  const todayDueDate = new Date(currentDate);
  
  // Task due soon (3 days from now)
  const soonDueDate = new Date(currentDate);
  soonDueDate.setDate(currentDate.getDate() + 3);
  
  // Task due in the future (15 days from now)
  const futureDueDate = new Date(currentDate);
  futureDueDate.setDate(currentDate.getDate() + 15);
  
  // Task overdue (2 days ago)
  const overdueDueDate = new Date(currentDate);
  overdueDueDate.setDate(currentDate.getDate() - 2);
  
  // Task completed (was due 5 days ago)
  const completedDueDate = new Date(currentDate);
  completedDueDate.setDate(currentDate.getDate() - 5);

  await db.insert(complianceTasks).values([
    {
      title: "EPF Payment",
      description: "Monthly EPF Payment for employees",
      type: "payment",
      dueDate: todayDueDate,
      status: "pending",
      priority: "high",
      amount: 45000,
      assignedTo: regularUser.id,
      createdBy: admin.id,
    },
    {
      title: "Income Tax Filing",
      description: "Corporate Income Tax filing for the quarter",
      type: "statutory",
      dueDate: soonDueDate,
      status: "pending",
      priority: "medium",
      assignedTo: regularUser.id,
      createdBy: admin.id,
    },
    {
      title: "TDS Payment",
      description: "Monthly TDS Payment",
      type: "payment",
      dueDate: overdueDueDate,
      status: "pending",
      priority: "high",
      amount: 25000,
      assignedTo: regularUser.id,
      createdBy: admin.id,
    },
    {
      title: "Office Lease Renewal",
      description: "Review and renew office lease agreement",
      type: "task",
      dueDate: futureDueDate,
      status: "pending",
      priority: "medium",
      assignedTo: manager.id,
      createdBy: admin.id,
    },
    {
      title: "GST Filing",
      description: "Monthly GST filing for February",
      type: "statutory",
      dueDate: completedDueDate,
      status: "completed",
      priority: "medium",
      assignedTo: teamLead.id,
      createdBy: admin.id,
    },
  ]);
  
  console.log("Created sample compliance tasks");
  
  console.log("✅ Database seeding completed successfully!");
}

// Don't run the seed function automatically
// It should be called explicitly from the server startup
// if process.env.NODE_ENV !== "production" && process.env.SEED_DB === "true"
