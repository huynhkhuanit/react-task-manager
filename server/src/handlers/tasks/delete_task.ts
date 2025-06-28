
import { db } from '../../db';
import { tasksTable } from '../../db/schema';
import { type Task } from '../../schema';
import { eq, and } from 'drizzle-orm';

export async function deleteTask(taskId: string, userId: string): Promise<Task> {
  try {
    // First, verify task exists and belongs to the user, then delete it
    const result = await db.delete(tasksTable)
      .where(and(
        eq(tasksTable.id, taskId),
        eq(tasksTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Task not found or unauthorized');
    }

    return result[0];
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
}
