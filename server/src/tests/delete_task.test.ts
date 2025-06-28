
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { deleteTask } from '../handlers/tasks/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task that belongs to the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task to be deleted',
        due_date: new Date('2024-12-31'),
        priority: 'medium',
        status: 'to do',
        user_id: user.id
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Delete the task
    const deletedTask = await deleteTask(task.id, user.id);

    // Verify the deleted task data
    expect(deletedTask.id).toEqual(task.id);
    expect(deletedTask.title).toEqual('Test Task');
    expect(deletedTask.description).toEqual('A task to be deleted');
    expect(deletedTask.priority).toEqual('medium');
    expect(deletedTask.status).toEqual('to do');
    expect(deletedTask.user_id).toEqual(user.id);
    expect(deletedTask.created_at).toBeInstanceOf(Date);
    expect(deletedTask.updated_at).toBeInstanceOf(Date);

    // Verify task is actually deleted from database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should throw error when task does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    
    const user = userResult[0];

    // Try to delete non-existent task (using valid UUID format)
    const nonExistentTaskId = '550e8400-e29b-41d4-a716-446655440000';
    await expect(deleteTask(nonExistentTaskId, user.id))
      .rejects.toThrow(/task not found or unauthorized/i);
  });

  it('should throw error when user tries to delete another users task', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1',
        provider: 'email'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2',
        provider: 'email'
      })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create task for user1
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'User 1 Task',
        description: 'This belongs to user 1',
        due_date: new Date('2024-12-31'),
        priority: 'high',
        status: 'in progress',
        user_id: user1.id
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Try to delete user1's task as user2
    await expect(deleteTask(task.id, user2.id))
      .rejects.toThrow(/task not found or unauthorized/i);

    // Verify task still exists in database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].title).toEqual('User 1 Task');
  });
});
