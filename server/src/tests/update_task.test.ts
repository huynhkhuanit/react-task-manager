
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/tasks/update_task';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null,
  password_hash: 'hashed_password',
  provider: 'email',
  provider_id: null
};

const testTask = {
  title: 'Original Task',
  description: 'Original description',
  due_date: new Date('2024-12-31'),
  priority: 'medium' as const,
  status: 'to do' as const
};

describe('updateTask', () => {
  let userId: string;
  let taskId: string;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test task directly
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userId
      })
      .returning()
      .execute();
    taskId = taskResult[0].id;
  });

  afterEach(resetDB);

  it('should update task title', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput, userId);

    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.priority).toEqual('medium'); // Unchanged
    expect(result.status).toEqual('to do'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const newDueDate = new Date('2025-01-15');
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Title',
      description: 'Updated description',
      due_date: newDueDate,
      priority: 'high',
      status: 'in progress'
    };

    const result = await updateTask(updateInput, userId);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('in progress');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task in database', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Database Updated Title',
      status: 'done'
    };

    await updateTask(updateInput, userId);

    // Verify changes persisted to database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Title');
    expect(tasks[0].status).toEqual('done');
    expect(tasks[0].description).toEqual('Original description'); // Unchanged
  });

  it('should throw error for non-existent task', async () => {
    // Use a valid UUID format for the test
    const updateInput: UpdateTaskInput = {
      id: '12345678-1234-5678-9012-123456789012',
      title: 'Should fail'
    };

    expect(updateTask(updateInput, userId)).rejects.toThrow(/task not found/i);
  });

  it('should throw error when user tries to update another users task', async () => {
    // Create another user
    const anotherUser = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'another@example.com'
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Unauthorized update'
    };

    // Try to update task with different user ID
    expect(updateTask(updateInput, anotherUser[0].id)).rejects.toThrow(/task not found/i);
  });

  it('should update only status field', async () => {
    const updateInput: UpdateTaskInput = {
      id: taskId,
      status: 'done'
    };

    const result = await updateTask(updateInput, userId);

    expect(result.status).toEqual('done');
    expect(result.title).toEqual('Original Task'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.priority).toEqual('medium'); // Unchanged
  });

  it('should always update updated_at timestamp', async () => {
    // Get original task to compare timestamp
    const originalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    // Wait a small amount to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: taskId,
      title: 'Timestamp test'
    };

    const result = await updateTask(updateInput, userId);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask[0].updated_at.getTime());
  });
});
