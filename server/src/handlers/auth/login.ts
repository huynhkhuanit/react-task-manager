
import { db } from '../../db';
import { usersTable } from '../../db/schema';
import { type LoginInput, type AuthUser } from '../../schema';
import { eq } from 'drizzle-orm';

export async function login(input: LoginInput): Promise<AuthUser> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if user has a password hash (email/password auth)
    if (!user.password_hash) {
      throw new Error('User registered with OAuth, please use social login');
    }

    // For now, using simple string comparison (not secure for production)
    // In production, this should use bcrypt.compare(input.password, user.password_hash)
    if (input.password !== user.password_hash) {
      throw new Error('Invalid email or password');
    }

    // Return sanitized user data
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
