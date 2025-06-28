
import { db } from '../../db';
import { usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { type AuthUser } from '../../schema';

export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  try {
    if (!userId) {
      return null;
    }

    // Fetch user from database
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      avatar_url: usersTable.avatar_url,
    })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    
    // Return sanitized user data (exclude sensitive fields like password_hash)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}
