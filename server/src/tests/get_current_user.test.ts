
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getCurrentUser } from '../handlers/auth/get_current_user';

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user data for valid user ID', async () => {
    // Create test user
    const testUser = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'email',
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    // Get current user
    const result = await getCurrentUser(userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
  });

  it('should return null for non-existent user ID', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    
    const result = await getCurrentUser(nonExistentId);

    expect(result).toBeNull();
  });

  it('should return null for empty user ID', async () => {
    const result = await getCurrentUser('');

    expect(result).toBeNull();
  });

  it('should return user with null name and avatar_url', async () => {
    // Create test user with minimal data
    const testUser = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        name: null,
        avatar_url: null,
        provider: 'email',
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    // Get current user
    const result = await getCurrentUser(userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('minimal@example.com');
    expect(result!.name).toBeNull();
    expect(result!.avatar_url).toBeNull();
  });

  it('should not expose sensitive fields like password_hash', async () => {
    // Create test user with password hash
    const testUser = await db.insert(usersTable)
      .values({
        email: 'secure@example.com',
        name: 'Secure User',
        password_hash: 'hashed_password_123',
        provider: 'email',
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    // Get current user
    const result = await getCurrentUser(userId);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('secure@example.com');
    expect(result!.name).toEqual('Secure User');
    
    // Ensure sensitive fields are not included
    expect((result as any).password_hash).toBeUndefined();
    expect((result as any).provider).toBeUndefined();
    expect((result as any).provider_id).toBeUndefined();
  });
});
