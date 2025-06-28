
import { z } from 'zod';

// Enums for task fields
export const taskPriorityEnum = z.enum(['low', 'medium', 'high']);
export const taskStatusEnum = z.enum(['to do', 'in progress', 'done']);

export type TaskPriority = z.infer<typeof taskPriorityEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;

// User schema
export const userSchema = z.object({
  id: z.string(), // UUID from Neon Auth
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.string(), // UUID
  title: z.string(),
  description: z.string(),
  due_date: z.coerce.date(),
  priority: taskPriorityEnum,
  status: taskStatusEnum,
  user_id: z.string(), // Foreign key to users
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  due_date: z.coerce.date(),
  priority: taskPriorityEnum,
  status: taskStatusEnum.default('to do'),
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  due_date: z.coerce.date().optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for updating task status (for drag and drop)
export const updateTaskStatusInputSchema = z.object({
  id: z.string(),
  status: taskStatusEnum,
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>;

// Auth schemas
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

// Login input schema
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Register input schema
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

// OAuth input schema
export const oauthInputSchema = z.object({
  provider: z.enum(['google', 'github']),
  code: z.string(),
});

export type OAuthInput = z.infer<typeof oauthInputSchema>;
