
import { db } from '../../db';
import { usersTable } from '../../db/schema';
import { type RegisterInput, type AuthUser } from '../../schema';
import { eq } from 'drizzle-orm';

export async function register(input: RegisterInput): Promise<{ user: AuthUser }> {
  try {
    // Check if user with email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password using Bun's built-in password hashing
    const passwordHash = await Bun.password.hash(input.password);

    // Create new user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name || null,
        password_hash: passwordHash,
        provider: 'email',
        provider_id: null,
        avatar_url: null
      })
      .returning()
      .execute();

    const user = result[0];

    // Return sanitized user data (without password)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      }
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
}
