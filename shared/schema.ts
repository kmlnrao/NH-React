import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json, uniqueIndex, foreignKey, smallint, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles enum
export const userRolesEnum = pgEnum('user_role', ['admin', 'manager', 'team_lead', 'user']);

// Notification status enum
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'delivered', 'read', 'actioned', 'dismissed']);

// Notification priority enum
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', ['statutory', 'payment', 'task', 'escalation']);

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  fullName: text('full_name').notNull(),
  role: userRolesEnum('role').notNull().default('user'),
  department: text('department'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
  notificationSettings: many(notificationSettings),
  escalationLevels: many(escalationLevels),
}));

// Compliance tasks table
export const complianceTasks = pgTable('compliance_tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: notificationTypeEnum('type').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull().default('pending'),
  priority: priorityEnum('priority').notNull().default('medium'),
  amount: integer('amount'), // For payment tasks
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Compliance tasks relations
export const complianceTasksRelations = relations(complianceTasks, ({ many, one }) => ({
  notifications: many(notifications),
  assignedUser: one(users, {
    fields: [complianceTasks.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [complianceTasks.createdBy],
    references: [users.id],
  }),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  taskId: integer('task_id').references(() => complianceTasks.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  priority: priorityEnum('priority').notNull().default('medium'),
  channels: json('channels').notNull().default(['dashboard']), // Array of channels: email, sms, push, dashboard
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
  actionedAt: timestamp('actioned_at'),
  escalationLevel: smallint('escalation_level').default(0),
  escalatedTo: integer('escalated_to').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  task: one(complianceTasks, {
    fields: [notifications.taskId],
    references: [complianceTasks.id],
  }),
  escalatedToUser: one(users, {
    fields: [notifications.escalatedTo],
    references: [users.id],
  }),
}));

// Notification logs table
export const notificationLogs = pgTable('notification_logs', {
  id: serial('id').primaryKey(),
  notificationId: integer('notification_id').references(() => notifications.id),
  userId: integer('user_id').references(() => users.id),
  status: notificationStatusEnum('status').notNull(),
  channel: text('channel').notNull(),
  metadata: json('metadata'), // Additional data like delivery status
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notification logs relations
export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationLogs.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [notificationLogs.userId],
    references: [users.id],
  }),
}));

// Notification settings table
export const notificationSettings = pgTable('notification_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
  reminderDays: smallint('reminder_days').notNull().default(7), // Days before due date to send reminder
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification settings relations
export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

// Escalation levels table
export const escalationLevels = pgTable('escalation_levels', {
  id: serial('id').primaryKey(),
  level: smallint('level').notNull(),
  userId: integer('user_id').references(() => users.id),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  daysBeforeEscalation: smallint('days_before_escalation').notNull(),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(true),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
  requiresAction: boolean('requires_action').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Escalation levels relations
export const escalationLevelsRelations = relations(escalationLevels, ({ one }) => ({
  user: one(users, {
    fields: [escalationLevels.userId],
    references: [users.id],
  }),
}));

// Message templates table
export const messageTemplates = pgTable('message_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: notificationTypeEnum('type').notNull(),
  template: text('template').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Message templates relations
export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [messageTemplates.createdBy],
    references: [users.id],
  }),
}));

// Zod schemas for inserting data
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  department: true,
});

export const insertComplianceTaskSchema = createInsertSchema(complianceTasks).pick({
  title: true,
  description: true,
  type: true,
  dueDate: true,
  status: true,
  priority: true,
  amount: true,
  assignedTo: true,
  createdBy: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  taskId: true,
  title: true,
  message: true,
  type: true,
  status: true,
  priority: true,
  channels: true,
  scheduledAt: true,
  escalationLevel: true,
  escalatedTo: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).pick({
  userId: true,
  notificationType: true,
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  whatsappEnabled: true,
  reminderDays: true,
});

export const insertEscalationLevelSchema = createInsertSchema(escalationLevels).pick({
  level: true,
  userId: true,
  notificationType: true,
  daysBeforeEscalation: true,
  emailEnabled: true,
  smsEnabled: true,
  pushEnabled: true,
  whatsappEnabled: true,
  requiresAction: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).pick({
  name: true,
  type: true,
  template: true,
  createdBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ComplianceTask = typeof complianceTasks.$inferSelect;
export type InsertComplianceTask = z.infer<typeof insertComplianceTaskSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationLog = typeof notificationLogs.$inferSelect;

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;

export type EscalationLevel = typeof escalationLevels.$inferSelect;
export type InsertEscalationLevel = z.infer<typeof insertEscalationLevelSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// Simple login schema for API requests
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
