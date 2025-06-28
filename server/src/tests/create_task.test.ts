
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, usersTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/tasks/create_task';
import { eq } from 'drizzle-orm';

// Test input for creating a task
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  due_date: new Date('2024-12-31'),
  priority: 'medium',
  status: 'to do'
};

describe('createTask', () => {
  let testUserId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        provider: 'email'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput, testUserId);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('to do');
    expect(result.user_id).toEqual(testUserId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput, testUserId);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].priority).toEqual('medium');
    expect(tasks[0].status).toEqual('to do');
    expect(tasks[0].user_id).toEqual(testUserId);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with default status', async () => {
    const inputWithDefaultStatus: CreateTaskInput = {
      title: 'Task With Default Status',
      description: 'Testing default status',
      due_date: new Date('2024-12-31'),
      priority: 'high',
      status: 'to do' // Explicitly set to default value
    };

    const result = await createTask(inputWithDefaultStatus, testUserId);

    expect(result.status).toEqual('to do');
    expect(result.title).toEqual('Task With Default Status');
    expect(result.priority).toEqual('high');
  });

  it('should handle different priority levels', async () => {
    const highPriorityInput: CreateTaskInput = {
      title: 'High Priority Task',
      description: 'Urgent task',
      due_date: new Date('2024-12-25'),
      priority: 'high',
      status: 'in progress'
    };

    const result = await createTask(highPriorityInput, testUserId);

    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('in progress');
    expect(result.title).toEqual('High Priority Task');

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].status).toEqual('in progress');
  });

  it('should fail when user does not exist', async () => {
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

    await expect(createTask(testInput, nonExistentUserId)).rejects.toThrow(/foreign key constraint/i);
  });
});
