import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupTaskScheduler } from "./tasks";
import { generateSampleData } from "./sample-data";
import {
  insertComplianceTaskSchema,
  insertNotificationSettingsSchema,
  insertEscalationLevelSchema,
  insertMessageTemplateSchema,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Set up the task scheduler
  setupTaskScheduler();

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user?.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Get current authenticated user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // Get users (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Compliance Tasks routes
  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const taskData = insertComplianceTaskSchema.parse(req.body);
      const task = await storage.createComplianceTask({
        ...taskData,
        createdBy: req.user!.id,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    try {
      const filters: any = {};
      
      // Parse query parameters
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.priority) filters.priority = req.query.priority as string;
      
      // If not admin, only show tasks assigned to the user
      if (req.user!.role !== "admin") {
        filters.assignedTo = req.user!.id;
      }
      
      const tasks = await storage.getComplianceTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getComplianceTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to view this task
      if (req.user!.role !== "admin" && task.assignedTo !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getComplianceTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user has permission to update this task
      if (req.user!.role !== "admin" && task.assignedTo !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const taskData = insertComplianceTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateComplianceTask(taskId, taskData);
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getComplianceTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Only admin or creator can delete a task
      if (req.user!.role !== "admin" && task.createdBy !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteComplianceTask(taskId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // If user is not admin, only show their own stats
      const userId = req.user!.role !== "admin" ? req.user!.id : undefined;
      const stats = await storage.getNotificationStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      
      const notifications = await storage.getNotifications(userId, type, status);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check if this notification belongs to the user
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsRead(notificationId);
      
      // Create a log entry
      await storage.createNotificationLog({
        notificationId,
        userId: req.user!.id,
        status: "read",
        channel: "dashboard",
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/:id/action", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.getNotification(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check if this notification belongs to the user
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsActioned(notificationId);
      
      // Create a log entry
      await storage.createNotificationLog({
        notificationId,
        userId: req.user!.id,
        status: "actioned",
        channel: "dashboard",
        metadata: { actionType: req.body.actionType || "general" },
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as actioned:", error);
      res.status(500).json({ message: "Failed to mark notification as actioned" });
    }
  });

  // Notification settings routes
  app.get("/api/notification-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.post("/api/notification-settings", isAuthenticated, async (req, res) => {
    try {
      const settingsData = insertNotificationSettingsSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const settings = await storage.createNotificationSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating notification settings:", error);
      res.status(500).json({ message: "Failed to create notification settings" });
    }
  });

  app.put("/api/notification-settings/:id", isAuthenticated, async (req, res) => {
    try {
      const settingsId = parseInt(req.params.id);
      const settingsData = insertNotificationSettingsSchema.partial().parse(req.body);
      
      // Ensure userId is not changed
      if (settingsData.userId && settingsData.userId !== req.user!.id) {
        return res.status(403).json({ message: "Cannot change user ID" });
      }
      
      const settings = await storage.updateNotificationSettings(settingsId, settingsData);
      
      if (!settings) {
        return res.status(404).json({ message: "Notification settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Escalation levels routes (admin only)
  app.get("/api/escalation-levels", isAuthenticated, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const levels = type
        ? await storage.getEscalationLevelsByType(type)
        : await storage.getEscalationLevels();
      
      res.json(levels);
    } catch (error) {
      console.error("Error fetching escalation levels:", error);
      res.status(500).json({ message: "Failed to fetch escalation levels" });
    }
  });

  app.post("/api/escalation-levels", isAdmin, async (req, res) => {
    try {
      const levelData = insertEscalationLevelSchema.parse(req.body);
      const level = await storage.createEscalationLevel(levelData);
      res.status(201).json(level);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating escalation level:", error);
      res.status(500).json({ message: "Failed to create escalation level" });
    }
  });

  app.put("/api/escalation-levels/:id", isAdmin, async (req, res) => {
    try {
      const levelId = parseInt(req.params.id);
      const levelData = insertEscalationLevelSchema.partial().parse(req.body);
      const level = await storage.updateEscalationLevel(levelId, levelData);
      
      if (!level) {
        return res.status(404).json({ message: "Escalation level not found" });
      }
      
      res.json(level);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating escalation level:", error);
      res.status(500).json({ message: "Failed to update escalation level" });
    }
  });

  app.delete("/api/escalation-levels/:id", isAdmin, async (req, res) => {
    try {
      const levelId = parseInt(req.params.id);
      await storage.deleteEscalationLevel(levelId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting escalation level:", error);
      res.status(500).json({ message: "Failed to delete escalation level" });
    }
  });

  // Message templates routes
  app.get("/api/message-templates", isAuthenticated, async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const templates = await storage.getMessageTemplates(type);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/message-templates", isAdmin, async (req, res) => {
    try {
      const templateData = insertMessageTemplateSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const template = await storage.createMessageTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating message template:", error);
      res.status(500).json({ message: "Failed to create message template" });
    }
  });

  app.put("/api/message-templates/:id", isAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const templateData = insertMessageTemplateSchema.partial().parse(req.body);
      
      // Ensure createdBy is not changed
      if (templateData.createdBy) {
        delete templateData.createdBy;
      }
      
      const template = await storage.updateMessageTemplate(templateId, templateData);
      
      if (!template) {
        return res.status(404).json({ message: "Message template not found" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating message template:", error);
      res.status(500).json({ message: "Failed to update message template" });
    }
  });

  app.delete("/api/message-templates/:id", isAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      await storage.deleteMessageTemplate(templateId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting message template:", error);
      res.status(500).json({ message: "Failed to delete message template" });
    }
  });

  // Sample data generation endpoint (only in development)
  app.post("/api/sample-data", async (req, res) => {
    try {
      // This endpoint is publicly accessible for development ease
      // but should be removed or secured in production
      const result = await generateSampleData();
      res.json(result);
    } catch (error) {
      console.error("Error generating sample data:", error);
      res.status(500).json({ message: "Failed to generate sample data" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
