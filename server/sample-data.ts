import { db } from "./db";
import { 
  users, 
  complianceTasks, 
  notifications,
  notificationSettings, 
  escalationLevels,
  messageTemplates,
  notificationLogs
} from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Current date for settings scheduledAt times
const now = new Date();

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Function to generate a future date
function getFutureDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Function to generate a past date
function getPastDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Sample departments
const departments = [
  "Finance", 
  "Human Resources", 
  "Legal", 
  "Operations", 
  "Information Technology", 
  "Compliance", 
  "Risk Management",
  "Tax", 
  "Audit", 
  "Corporate Affairs"
];

// Sample task types
const taskTypes = ["statutory", "payment", "task", "escalation"];

// Sample priorities
const priorities = ["low", "medium", "high", "critical"];

// Sample notification statuses
const notificationStatuses = ["pending", "sent", "delivered", "read", "actioned", "dismissed"];

export async function generateSampleData() {
  console.log("🌱 Generating comprehensive sample data...");

  // Default password for testing
  const defaultPassword = await hashPassword("password123");

  // Create admin users (5)
  const adminUsers = [];
  for (let i = 1; i <= 5; i++) {
    const [admin] = await db.insert(users).values({
      username: `admin${i}`,
      password: defaultPassword,
      email: `admin${i}@compliance.com`,
      fullName: `Admin User ${i}`,
      role: "admin",
      department: departments[i % departments.length],
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    }).returning();
    
    adminUsers.push(admin);
    console.log(`Created admin user: ${admin.username}`);
  }

  // Create manager users (10)
  const managerUsers = [];
  for (let i = 1; i <= 10; i++) {
    const [manager] = await db.insert(users).values({
      username: `manager${i}`,
      password: defaultPassword,
      email: `manager${i}@compliance.com`,
      fullName: `Manager User ${i}`,
      role: "manager",
      department: departments[i % departments.length],
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    }).returning();
    
    managerUsers.push(manager);
    console.log(`Created manager user: ${manager.username}`);
  }

  // Create team lead users (15)
  const teamLeadUsers = [];
  for (let i = 1; i <= 15; i++) {
    const [teamLead] = await db.insert(users).values({
      username: `teamlead${i}`,
      password: defaultPassword,
      email: `teamlead${i}@compliance.com`,
      fullName: `Team Lead User ${i}`,
      role: "team_lead",
      department: departments[i % departments.length],
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    }).returning();
    
    teamLeadUsers.push(teamLead);
    console.log(`Created team lead user: ${teamLead.username}`);
  }

  // Create regular users (20)
  const regularUsers = [];
  for (let i = 1; i <= 20; i++) {
    const [user] = await db.insert(users).values({
      username: `user${i}`,
      password: defaultPassword,
      email: `user${i}@compliance.com`,
      fullName: `Regular User ${i}`,
      role: "user",
      department: departments[i % departments.length],
      phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    }).returning();
    
    regularUsers.push(user);
    console.log(`Created regular user: ${user.username}`);
  }

  // Combine all users for easier access
  const allUsers = [...adminUsers, ...managerUsers, ...teamLeadUsers, ...regularUsers];
  console.log(`✅ Created total of ${allUsers.length} users`);

  // Create notification settings for each user
  console.log("Creating notification settings for all users...");
  for (const user of allUsers) {
    for (const type of taskTypes) {
      await db.insert(notificationSettings).values({
        userId: user.id,
        notificationType: type as any,
        emailEnabled: true,
        smsEnabled: user.role === "admin" || user.role === "manager", // Only enable SMS for higher roles
        pushEnabled: true,
        whatsappEnabled: false,
        reminderDays: type === "statutory" ? 7 : type === "payment" ? 3 : type === "task" ? 1 : 30,
      });
    }
  }
  console.log("✅ Created notification settings for all users");

  // Create escalation levels for different departments
  console.log("Creating escalation levels...");
  for (const department of departments) {
    // Get team leads for this department
    const departmentTeamLeads = teamLeadUsers.filter(u => u.department === department);
    
    // Get managers for this department
    const departmentManagers = managerUsers.filter(u => u.department === department);
    
    // Get admins (they cover all departments)
    const departmentAdmins = adminUsers.slice(0, 2);

    // If we have team leads and managers for this department, create escalation levels
    if (departmentTeamLeads.length > 0 && departmentManagers.length > 0) {
      for (const type of taskTypes) {
        // Level 1: Team Lead
        if (departmentTeamLeads[0]) {
          await db.insert(escalationLevels).values({
            level: 1,
            userId: departmentTeamLeads[0].id,
            notificationType: type as any,
            daysBeforeEscalation: 1,
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            whatsappEnabled: false,
            requiresAction: true,
          });
        }

        // Level 2: Manager
        if (departmentManagers[0]) {
          await db.insert(escalationLevels).values({
            level: 2,
            userId: departmentManagers[0].id,
            notificationType: type as any,
            daysBeforeEscalation: 3,
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            whatsappEnabled: false,
            requiresAction: true,
          });
        }

        // Level 3: Admin (highest escalation)
        if (departmentAdmins[0]) {
          await db.insert(escalationLevels).values({
            level: 3,
            userId: departmentAdmins[0].id,
            notificationType: type as any,
            daysBeforeEscalation: 5,
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            whatsappEnabled: false,
            requiresAction: true,
          });
        }
      }
    }
  }
  console.log("✅ Created escalation levels");

  // Create message templates
  console.log("Creating message templates...");
  await db.insert(messageTemplates).values([
    {
      name: "Standard Payment Reminder",
      type: "payment",
      template: "[Payment Type] payment of [Amount] is due on [Due Date]. Please process the payment to avoid penalties.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Urgent Payment Reminder",
      type: "payment",
      template: "URGENT: [Payment Type] payment of [Amount] is due on [Due Date]. This is a critical payment that must be processed immediately.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Standard Statutory Reminder",
      type: "statutory",
      template: "Reminder: [Compliance Type] filing deadline is [Due Date]. Please prepare the necessary documents.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Critical Statutory Reminder",
      type: "statutory",
      template: "CRITICAL: [Compliance Type] filing deadline is [Due Date]. Non-compliance will result in significant penalties.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Standard Task Reminder",
      type: "task",
      template: "Task [Task Name] is due on [Due Date]. [Task Description]",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Level 1 Escalation",
      type: "escalation",
      template: "ESCALATION LEVEL 1: [Task Name] is [Days] days overdue. This has been escalated to the team lead.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Level 2 Escalation",
      type: "escalation",
      template: "ESCALATION LEVEL 2: [Task Name] is [Days] days overdue. This has been escalated to the department manager.",
      createdBy: adminUsers[0].id,
    },
    {
      name: "Level 3 Escalation",
      type: "escalation",
      template: "ESCALATION LEVEL 3: [Task Name] is [Days] days overdue. This has been escalated to administration.",
      createdBy: adminUsers[0].id,
    },
  ]);
  console.log("✅ Created message templates");

  // Create sample compliance tasks (100 tasks with various due dates and statuses)
  console.log("Creating sample compliance tasks...");
  const tasks = [];
  
  // Generate Statutory compliance tasks (30)
  const statutoryTasks = [
    "Annual Corporate Tax Filing",
    "Quarterly GST Return",
    "Monthly TDS Filing",
    "Annual Financial Statement Submission",
    "Directors' Report Filing",
    "ESI Compliance Filing",
    "PF Compliance Filing",
    "Corporate Social Responsibility Reporting",
    "Environmental Compliance Report",
    "Labor Law Compliance Certificate",
    "Factory License Renewal",
    "Annual General Meeting",
    "Board Meeting Minutes Filing",
    "Insider Trading Compliance Report",
    "Anti-Money Laundering Compliance",
  ];
  
  for (let i = 0; i < 30; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const randomCreator = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days from now
    const dueDate = daysOffset < 0 ? getPastDate(Math.abs(daysOffset)) : getFutureDate(daysOffset);
    
    // Determine status based on due date
    let status = "pending";
    if (daysOffset < -5) {
      // Tasks due more than 5 days ago have 60% chance of being completed
      status = Math.random() < 0.6 ? "completed" : "pending";
    } else if (daysOffset < 0) {
      // Tasks due less than 5 days ago have 20% chance of being completed
      status = Math.random() < 0.2 ? "completed" : "pending";
    }
    
    const [task] = await db.insert(complianceTasks).values({
      title: statutoryTasks[i % statutoryTasks.length],
      description: `${statutoryTasks[i % statutoryTasks.length]} required by regulatory authorities`,
      type: "statutory",
      dueDate: dueDate,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
      assignedTo: randomUser.id,
      createdBy: randomCreator.id,
    }).returning();
    
    tasks.push(task);
  }
  
  // Generate Payment tasks (30)
  const paymentTasks = [
    "Monthly Office Rent Payment",
    "Quarterly Insurance Premium",
    "Employee Salary Disbursement",
    "Vendor Payment - IT Services",
    "Utility Bills Payment",
    "Loan EMI Payment",
    "Annual License Fee",
    "GST Payment",
    "TDS Payment",
    "Professional Tax Payment",
    "Dividend Payment",
    "Foreign Currency Remittance",
    "Capital Expenditure Payment",
    "Contractor Payment",
    "Annual Maintenance Contract Payment",
  ];
  
  for (let i = 0; i < 30; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const randomCreator = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days from now
    const dueDate = daysOffset < 0 ? getPastDate(Math.abs(daysOffset)) : getFutureDate(daysOffset);
    
    // Determine status based on due date
    let status = "pending";
    if (daysOffset < -5) {
      // Tasks due more than 5 days ago have 70% chance of being completed (payments tend to be prioritized)
      status = Math.random() < 0.7 ? "completed" : "pending";
    } else if (daysOffset < 0) {
      // Tasks due less than 5 days ago have 30% chance of being completed
      status = Math.random() < 0.3 ? "completed" : "pending";
    }
    
    const amount = Math.floor(Math.random() * 90000) + 10000; // Random amount between 10000 and 100000
    
    const [task] = await db.insert(complianceTasks).values({
      title: paymentTasks[i % paymentTasks.length],
      description: `Payment of ${amount} due for ${paymentTasks[i % paymentTasks.length]}`,
      type: "payment",
      dueDate: dueDate,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
      amount: amount,
      assignedTo: randomUser.id,
      createdBy: randomCreator.id,
    }).returning();
    
    tasks.push(task);
  }
  
  // Generate Task-based tasks (20)
  const generalTasks = [
    "Contract Review",
    "Policy Update",
    "Internal Audit",
    "Compliance Training Session",
    "Performance Review",
    "Risk Assessment",
    "Process Documentation",
    "Security Audit",
    "Vendor Compliance Check",
    "Customer Due Diligence",
  ];
  
  for (let i = 0; i < 20; i++) {
    const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
    const randomCreator = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days from now
    const dueDate = daysOffset < 0 ? getPastDate(Math.abs(daysOffset)) : getFutureDate(daysOffset);
    
    // Determine status based on due date
    let status = "pending";
    if (daysOffset < -7) {
      // Tasks due more than 7 days ago have 50% chance of being completed
      status = Math.random() < 0.5 ? "completed" : "pending";
    } else if (daysOffset < 0) {
      // Tasks due less than 7 days ago have 25% chance of being completed
      status = Math.random() < 0.25 ? "completed" : "pending";
    }
    
    const [task] = await db.insert(complianceTasks).values({
      title: generalTasks[i % generalTasks.length],
      description: `Complete ${generalTasks[i % generalTasks.length]} by due date`,
      type: "task",
      dueDate: dueDate,
      status: status,
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
      assignedTo: randomUser.id,
      createdBy: randomCreator.id,
    }).returning();
    
    tasks.push(task);
  }
  
  // Generate Escalation tasks (10) - These are typically created as part of the escalation process
  const escalationTasks = [
    "Overdue Tax Filing Resolution",
    "Critical Payment Escalation",
    "Compliance Violation Resolution",
    "Regulatory Deadline Extension Request",
    "Audit Finding Resolution",
  ];
  
  for (let i = 0; i < 10; i++) {
    // Escalation tasks are assigned to managers or admins
    const randomUser = [...managerUsers, ...adminUsers][Math.floor(Math.random() * (managerUsers.length + adminUsers.length))];
    const randomCreator = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const daysOffset = Math.floor(Math.random() * 20) - 10; // -10 to +10 days from now
    const dueDate = daysOffset < 0 ? getPastDate(Math.abs(daysOffset)) : getFutureDate(daysOffset);
    
    // Determine status based on due date
    let status = "pending";
    if (daysOffset < -3) {
      // Escalation tasks due more than 3 days ago have 40% chance of being completed
      status = Math.random() < 0.4 ? "completed" : "pending";
    }
    
    const [task] = await db.insert(complianceTasks).values({
      title: escalationTasks[i % escalationTasks.length],
      description: `Escalated: ${escalationTasks[i % escalationTasks.length]} requires immediate attention`,
      type: "escalation",
      dueDate: dueDate,
      status: status,
      priority: "critical" as any, // Escalations are always critical
      assignedTo: randomUser.id,
      createdBy: randomCreator.id,
    }).returning();
    
    tasks.push(task);
  }
  
  console.log(`✅ Created ${tasks.length} compliance tasks`);

  // Create notifications for all tasks
  console.log("Creating notifications for tasks...");
  const notifs = [];
  
  for (const task of tasks) {
    // Calculate how many days until/since the due date
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine status based on task status and due date
    let status = "pending";
    
    if (task.status === "completed") {
      status = "actioned";
    } else if (daysUntilDue < -7) {
      // Severely overdue tasks
      status = Math.random() < 0.3 ? "actioned" : (Math.random() < 0.5 ? "read" : "sent");
    } else if (daysUntilDue < 0) {
      // Overdue tasks
      status = Math.random() < 0.2 ? "actioned" : (Math.random() < 0.4 ? "read" : "sent");
    } else if (daysUntilDue < 3) {
      // Due soon
      status = Math.random() < 0.1 ? "actioned" : (Math.random() < 0.3 ? "read" : "sent");
    } else {
      // Due in the future
      status = Math.random() < 0.7 ? "sent" : "delivered";
    }
    
    // Create a notification for the task
    const [notification] = await db.insert(notifications).values({
      userId: task.assignedTo,
      taskId: task.id,
      title: `${task.title} - ${daysUntilDue < 0 ? 'Overdue' : 'Due Soon'}`,
      message: `Task "${task.title}" is ${daysUntilDue < 0 ? `overdue by ${Math.abs(daysUntilDue)} days` : `due in ${daysUntilDue} days`}. ${task.description}`,
      type: task.type as any,
      status: status as any,
      priority: task.priority as any,
      channels: ["dashboard"],
      scheduledAt: now,
      sentAt: new Date(),
      readAt: ["read", "actioned"].includes(status) ? new Date() : null,
      actionedAt: status === "actioned" ? new Date() : null,
      escalationLevel: daysUntilDue < -5 ? 1 : 0,
    }).returning();
    
    notifs.push(notification);
    
    // Create notification logs for each notification
    await db.insert(notificationLogs).values({
      notificationId: notification.id,
      userId: task.assignedTo,
      status: "sent" as any,
      channel: "dashboard",
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000)),
    });
    
    if (["delivered", "read", "actioned"].includes(status)) {
      await db.insert(notificationLogs).values({
        notificationId: notification.id,
        userId: task.assignedTo,
        status: "delivered" as any,
        channel: "dashboard",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 900000)),
      });
    }
    
    if (["read", "actioned"].includes(status)) {
      await db.insert(notificationLogs).values({
        notificationId: notification.id,
        userId: task.assignedTo,
        status: "read" as any,
        channel: "dashboard",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 800000)),
      });
    }
    
    if (status === "actioned") {
      await db.insert(notificationLogs).values({
        notificationId: notification.id,
        userId: task.assignedTo,
        status: "actioned" as any,
        channel: "dashboard",
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 700000)),
      });
    }
  }
  
  console.log(`✅ Created ${notifs.length} notifications with logs`);

  console.log("✅ Sample data generation completed successfully!");
  
  return {
    users: allUsers.length,
    tasks: tasks.length,
    notifications: notifs.length,
  };
}

// Export hashing function to be used elsewhere
export { hashPassword };