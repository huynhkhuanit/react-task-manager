
import { db } from '../../db';
import { tasksTable } from '../../db/schema';
import { type UpdateTaskStatusInput, type Task } from '../../schema';
import { eq, and } from 'drizzle-orm';

export async function updateTaskStatus(input: UpdateTaskStatusInput, userId: string): Promise<Task> {
  try {
    // Update the task status and updated_at timestamp
    const result = await db.update(tasksTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(
        and(
          eq(tasksTable.id, input.id),
          eq(tasksTable.user_id, userId)
        )
      )
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Task not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Task status update failed:', error);
    throw error;
  }
}
