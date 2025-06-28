
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/tasks/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no tasks', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getTasks(userId);

    expect(result).toEqual([]);
  });

  it('should return tasks for the specified user', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test tasks - insert separately to ensure different timestamps
    const taskInput1: CreateTaskInput = {
      title: 'First Task',
      description: 'First task description',
      due_date: new Date('2024-12-31'),
      priority: 'high',
      status: 'to do'
    };

    await db.insert(tasksTable)
      .values({
        ...taskInput1,
        user_id: userId
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const taskInput2: CreateTaskInput = {
      title: 'Second Task',
      description: 'Second task description',
      due_date: new Date('2024-12-30'),
      priority: 'medium',
      status: 'in progress'
    };

    await db.insert(tasksTable)
      .values({
        ...taskInput2,
        user_id: userId
      })
      .execute();

    const result = await getTasks(userId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Second Task'); // Most recent first
    expect(result[0].description).toEqual('Second task description');
    expect(result[0].priority).toEqual('medium');
    expect(result[0].status).toEqual('in progress');
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('First Task');
    expect(result[1].description).toEqual('First task description');
    expect(result[1].priority).toEqual('high');
    expect(result[1].status).toEqual('to do');
    expect(result[1].user_id).toEqual(userId);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should only return tasks for the specified user', async () => {
    // Create two users
    const userResult1 = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User One',
        provider: 'email'
      })
      .returning()
      .execute();

    const userResult2 = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User Two',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId1 = userResult1[0].id;
    const userId2 = userResult2[0].id;

    // Create tasks for both users
    await db.insert(tasksTable)
      .values([
        {
          title: 'User 1 Task',
          description: 'Task for user 1',
          due_date: new Date('2024-12-31'),
          priority: 'high',
          status: 'to do',
          user_id: userId1
        },
        {
          title: 'User 2 Task',
          description: 'Task for user 2',
          due_date: new Date('2024-12-30'),
          priority: 'medium',
          status: 'in progress',
          user_id: userId2
        }
      ])
      .execute();

    const result = await getTasks(userId1);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('User 1 Task');
    expect(result[0].user_id).toEqual(userId1);
  });

  it('should order tasks by created_at descending', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: 'Older Task',
        description: 'This was created first',
        due_date: new Date('2024-12-31'),
        priority: 'low',
        status: 'to do',
        user_id: userId
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: 'Newer Task',
        description: 'This was created second',
        due_date: new Date('2024-12-30'),
        priority: 'high',
        status: 'done',
        user_id: userId
      })
      .execute();

    const result = await getTasks(userId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Task'); // Most recent first
    expect(result[1].title).toEqual('Older Task');
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });
});
