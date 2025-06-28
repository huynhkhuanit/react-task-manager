
import { db } from '../../db';
import { tasksTable } from '../../db/schema';
import { type Task } from '../../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTasks(userId: string): Promise<Task[]> {
  try {
    // Query tasks table filtered by user_id, ordered by created_at descending
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.user_id, userId))
      .orderBy(desc(tasksTable.created_at))
      .execute();

    // Return tasks (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Get tasks failed:', error);
    throw error;
  }
}
