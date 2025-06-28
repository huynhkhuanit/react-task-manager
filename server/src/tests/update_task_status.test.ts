
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type UpdateTaskStatusInput } from '../schema';
import { updateTaskStatus } from '../handlers/tasks/update_task_status';
import { eq, and } from 'drizzle-orm';

describe('updateTaskStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task status', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        due_date: new Date(),
        priority: 'medium',
        status: 'to do',
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    const input: UpdateTaskStatusInput = {
      id: taskId,
      status: 'in progress'
    };

    const result = await updateTaskStatus(input, userId);

    // Verify the status was updated
    expect(result.id).toEqual(taskId);
    expect(result.status).toEqual('in progress');
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.priority).toEqual('medium');
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the task in the database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        due_date: new Date(),
        priority: 'high',
        status: 'to do',
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;
    const originalUpdatedAt = taskResult[0].updated_at;

    const input: UpdateTaskStatusInput = {
      id: taskId,
      status: 'done'
    };

    await updateTaskStatus(input, userId);

    // Query the database to verify the update
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toEqual('done');
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should only update tasks owned by the user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1',
        provider: 'email'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2',
        provider: 'email'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create task for user1
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'User 1 Task',
        description: 'A task for user 1',
        due_date: new Date(),
        priority: 'low',
        status: 'to do',
        user_id: user1Id
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    const input: UpdateTaskStatusInput = {
      id: taskId,
      status: 'in progress'
    };

    // Try to update user1's task as user2 - should fail
    await expect(updateTaskStatus(input, user2Id))
      .rejects.toThrow(/task not found or access denied/i);

    // Verify the task status was not changed
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks[0].status).toEqual('to do');
  });

  it('should fail when task does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: UpdateTaskStatusInput = {
      id: '00000000-0000-0000-0000-000000000000', // Non-existent task ID
      status: 'done'
    };

    await expect(updateTaskStatus(input, userId))
      .rejects.toThrow(/task not found or access denied/i);
  });
});
