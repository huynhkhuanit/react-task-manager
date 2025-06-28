
import { db } from '../../db';
import { tasksTable } from '../../db/schema';
import { type CreateTaskInput, type Task } from '../../schema';

export const createTask = async (input: CreateTaskInput, userId: string): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        priority: input.priority,
        status: input.status, // Uses default 'to do' from schema if not provided
        user_id: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
