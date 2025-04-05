import { db } from "./db";
import { 
  users, User, InsertUser, 
  complianceTasks, ComplianceTask, InsertComplianceTask,
  notifications, Notification, InsertNotification,
  notificationLogs, NotificationLog,
  notificationSettings, NotificationSettings, InsertNotificationSettings,
  escalationLevels, EscalationLevel, InsertEscalationLevel,
  messageTemplates, MessageTemplate, InsertMessageTemplate
} from "@shared/schema";
import { eq, and, or, gte, lte, desc, asc, sql as sqlQuery } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Compliance task methods
  createComplianceTask(task: InsertComplianceTask): Promise<ComplianceTask>;
  getComplianceTask(id: number): Promise<ComplianceTask | undefined>;
  updateComplianceTask(id: number, taskData: Partial<InsertComplianceTask>): Promise<ComplianceTask | undefined>;
  deleteComplianceTask(id: number): Promise<boolean>;
  getComplianceTasks(filters?: Partial<ComplianceTask>): Promise<ComplianceTask[]>;
  getTasksDueSoon(days: number): Promise<ComplianceTask[]>;
  getOverdueTasks(): Promise<ComplianceTask[]>;
  
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotification(id: number): Promise<Notification | undefined>;
  updateNotification(id: number, notificationData: Partial<InsertNotification>): Promise<Notification | undefined>;
  getNotifications(userId?: number, type?: string, status?: string): Promise<Notification[]>;
  getNotificationsByTask(taskId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markNotificationAsActioned(id: number): Promise<boolean>;
  
  // Notification logs methods
  createNotificationLog(log: Partial<NotificationLog>): Promise<NotificationLog>;
  getNotificationLogs(notificationId: number): Promise<NotificationLog[]>;
  
  // Notification settings methods
  getNotificationSettings(userId: number): Promise<NotificationSettings[]>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(id: number, settingsData: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined>;
  
  // Escalation levels methods
  getEscalationLevels(): Promise<EscalationLevel[]>;
  getEscalationLevelsByType(type: string): Promise<EscalationLevel[]>;
  createEscalationLevel(level: InsertEscalationLevel): Promise<EscalationLevel>;
  updateEscalationLevel(id: number, levelData: Partial<InsertEscalationLevel>): Promise<EscalationLevel | undefined>;
  deleteEscalationLevel(id: number): Promise<boolean>;
  
  // Message templates methods
  getMessageTemplates(type?: string): Promise<MessageTemplate[]>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, templateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: number): Promise<boolean>;
  
  // Dashboard statistics
  getNotificationStats(userId?: number): Promise<{
    total: number;
    dueSoon: number;
    overdue: number;
    completed: number;
  }>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Compliance task methods
  async createComplianceTask(task: InsertComplianceTask): Promise<ComplianceTask> {
    const [createdTask] = await db.insert(complianceTasks).values(task).returning();
    return createdTask;
  }

  async getComplianceTask(id: number): Promise<ComplianceTask | undefined> {
    const [task] = await db.select().from(complianceTasks).where(eq(complianceTasks.id, id));
    return task;
  }

  async updateComplianceTask(id: number, taskData: Partial<InsertComplianceTask>): Promise<ComplianceTask | undefined> {
    const [task] = await db
      .update(complianceTasks)
      .set(taskData)
      .where(eq(complianceTasks.id, id))
      .returning();
    return task;
  }

  async deleteComplianceTask(id: number): Promise<boolean> {
    const [deletedTask] = await db
      .delete(complianceTasks)
      .where(eq(complianceTasks.id, id))
      .returning({ id: complianceTasks.id });
    return !!deletedTask;
  }

  async getComplianceTasks(filters?: Partial<ComplianceTask>): Promise<ComplianceTask[]> {
    let query = db.select().from(complianceTasks);
    
    if (filters) {
      const conditions = [];
      
      if (filters.type) {
        conditions.push(eq(complianceTasks.type, filters.type));
      }
      
      if (filters.status) {
        conditions.push(eq(complianceTasks.status, filters.status));
      }
      
      if (filters.assignedTo) {
        conditions.push(eq(complianceTasks.assignedTo, filters.assignedTo));
      }
      
      if (filters.priority) {
        conditions.push(eq(complianceTasks.priority, filters.priority));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(complianceTasks.dueDate));
  }

  async getTasksDueSoon(days: number): Promise<ComplianceTask[]> {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + days);
    
    return await db
      .select()
      .from(complianceTasks)
      .where(
        and(
          gte(complianceTasks.dueDate, currentDate),
          lte(complianceTasks.dueDate, futureDate),
          eq(complianceTasks.status, 'pending')
        )
      )
      .orderBy(asc(complianceTasks.dueDate));
  }

  async getOverdueTasks(): Promise<ComplianceTask[]> {
    const currentDate = new Date();
    
    return await db
      .select()
      .from(complianceTasks)
      .where(
        and(
          lte(complianceTasks.dueDate, currentDate),
          eq(complianceTasks.status, 'pending')
        )
      )
      .orderBy(asc(complianceTasks.dueDate));
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [createdNotification] = await db.insert(notifications).values(notification).returning();
    return createdNotification;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async updateNotification(id: number, notificationData: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set(notificationData)
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async getNotifications(userId?: number, type?: string, status?: string): Promise<Notification[]> {
    let query = db.select().from(notifications);
    
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(notifications.userId, userId));
    }
    
    if (type) {
      conditions.push(eq(notifications.type, type));
    }
    
    if (status) {
      conditions.push(eq(notifications.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByTask(taskId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.taskId, taskId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [notification] = await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning({ id: notifications.id });
    return !!notification;
  }

  async markNotificationAsActioned(id: number): Promise<boolean> {
    const [notification] = await db
      .update(notifications)
      .set({ 
        status: 'actioned',
        actionedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning({ id: notifications.id });
    return !!notification;
  }

  // Notification logs methods
  async createNotificationLog(log: Partial<NotificationLog>): Promise<NotificationLog> {
    const [createdLog] = await db.insert(notificationLogs).values(log).returning();
    return createdLog;
  }

  async getNotificationLogs(notificationId: number): Promise<NotificationLog[]> {
    return await db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.notificationId, notificationId))
      .orderBy(desc(notificationLogs.createdAt));
  }

  // Notification settings methods
  async getNotificationSettings(userId: number): Promise<NotificationSettings[]> {
    return await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const [createdSettings] = await db.insert(notificationSettings).values(settings).returning();
    return createdSettings;
  }

  async updateNotificationSettings(id: number, settingsData: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> {
    const [settings] = await db
      .update(notificationSettings)
      .set(settingsData)
      .where(eq(notificationSettings.id, id))
      .returning();
    return settings;
  }

  // Escalation levels methods
  async getEscalationLevels(): Promise<EscalationLevel[]> {
    return await db
      .select()
      .from(escalationLevels)
      .orderBy(asc(escalationLevels.level));
  }

  async getEscalationLevelsByType(type: string): Promise<EscalationLevel[]> {
    return await db
      .select()
      .from(escalationLevels)
      .where(eq(escalationLevels.notificationType, type))
      .orderBy(asc(escalationLevels.level));
  }

  async createEscalationLevel(level: InsertEscalationLevel): Promise<EscalationLevel> {
    const [createdLevel] = await db.insert(escalationLevels).values(level).returning();
    return createdLevel;
  }

  async updateEscalationLevel(id: number, levelData: Partial<InsertEscalationLevel>): Promise<EscalationLevel | undefined> {
    const [level] = await db
      .update(escalationLevels)
      .set(levelData)
      .where(eq(escalationLevels.id, id))
      .returning();
    return level;
  }

  async deleteEscalationLevel(id: number): Promise<boolean> {
    const [deletedLevel] = await db
      .delete(escalationLevels)
      .where(eq(escalationLevels.id, id))
      .returning({ id: escalationLevels.id });
    return !!deletedLevel;
  }

  // Message templates methods
  async getMessageTemplates(type?: string): Promise<MessageTemplate[]> {
    let query = db.select().from(messageTemplates);
    
    if (type) {
      query = query.where(eq(messageTemplates.type, type));
    }
    
    return await query.orderBy(asc(messageTemplates.name));
  }

  async createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate> {
    const [createdTemplate] = await db.insert(messageTemplates).values(template).returning();
    return createdTemplate;
  }

  async updateMessageTemplate(id: number, templateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .update(messageTemplates)
      .set(templateData)
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    const [deletedTemplate] = await db
      .delete(messageTemplates)
      .where(eq(messageTemplates.id, id))
      .returning({ id: messageTemplates.id });
    return !!deletedTemplate;
  }

  // Dashboard statistics
  async getNotificationStats(userId?: number): Promise<{
    total: number;
    dueSoon: number;
    overdue: number;
    completed: number;
  }> {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 7); // Tasks due in next 7 days
    
    let userFilter = '';
    if (userId) {
      userFilter = `AND "assigned_to" = ${userId}`;
    }
    
    const result = await db.execute(sqlQuery`
      SELECT
        COUNT(*) AS total,
        SUM(CASE 
          WHEN "due_date" > ${currentDate} AND "due_date" <= ${futureDate} AND "status" = 'pending' 
          THEN 1 ELSE 0 
        END) AS due_soon,
        SUM(CASE 
          WHEN "due_date" < ${currentDate} AND "status" = 'pending' 
          THEN 1 ELSE 0 
        END) AS overdue,
        SUM(CASE 
          WHEN "status" = 'completed' 
          THEN 1 ELSE 0 
        END) AS completed
      FROM "compliance_tasks"
      WHERE 1=1 ${userFilter ? sqlQuery.raw(userFilter) : sqlQuery.raw('')}
    `);
    
    return {
      total: Number(result[0]?.total || 0),
      dueSoon: Number(result[0]?.due_soon || 0),
      overdue: Number(result[0]?.overdue || 0),
      completed: Number(result[0]?.completed || 0),
    };
  }
}

export const storage = new DatabaseStorage();
