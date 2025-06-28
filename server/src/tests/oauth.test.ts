
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type OAuthInput } from '../schema';
import { oauth } from '../handlers/auth/oauth';
import { eq } from 'drizzle-orm';

describe('oauth', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new user for Google OAuth', async () => {
    const input: OAuthInput = {
      provider: 'google',
      code: 'valid_google_code',
    };

    const result = await oauth(input);

    // Verify returned user data
    expect(result.id).toBeDefined();
    expect(result.email).toEqual('user@gmail.com');
    expect(result.name).toEqual('Google User');
    expect(result.avatar_url).toEqual('https://lh3.googleusercontent.com/a/default-user');

    // Verify user was saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual('user@gmail.com');
    expect(user.name).toEqual('Google User');
    expect(user.provider).toEqual('google');
    expect(user.provider_id).toEqual('google_123456789');
    expect(user.password_hash).toBeNull();
  });

  it('should create new user for GitHub OAuth', async () => {
    const input: OAuthInput = {
      provider: 'github',
      code: 'valid_github_code',
    };

    const result = await oauth(input);

    // Verify returned user data
    expect(result.id).toBeDefined();
    expect(result.email).toEqual('user@github.com');
    expect(result.name).toEqual('GitHub User');
    expect(result.avatar_url).toEqual('https://avatars.githubusercontent.com/u/123456?v=4');

    // Verify user was saved to database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.provider).toEqual('github');
    expect(user.provider_id).toEqual('github_987654321');
  });

  it('should update existing user on subsequent OAuth login', async () => {
    // First OAuth login - create user
    const input: OAuthInput = {
      provider: 'google',
      code: 'valid_google_code',
    };

    const firstResult = await oauth(input);
    const originalCreatedAt = (await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, firstResult.id))
      .execute())[0].created_at;

    // Second OAuth login - should update existing user
    const secondResult = await oauth(input);

    // Should return same user ID
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.email).toEqual('user@gmail.com');

    // Verify only one user exists in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(1);
    const user = allUsers[0];
    expect(user.id).toEqual(firstResult.id);
    expect(user.created_at).toEqual(originalCreatedAt);
    expect(user.updated_at > originalCreatedAt).toBe(true);
  });

  it('should throw error for invalid authorization code', async () => {
    const input: OAuthInput = {
      provider: 'google',
      code: 'invalid_code',
    };

    await expect(oauth(input)).rejects.toThrow(/invalid authorization code/i);
  });

  it('should handle timestamps correctly', async () => {
    const input: OAuthInput = {
      provider: 'google',
      code: 'valid_google_code',
    };

    const result = await oauth(input);

    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    const user = users[0];
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
    expect(user.created_at <= user.updated_at).toBe(true);
  });

  it('should not include sensitive fields in response', async () => {
    const input: OAuthInput = {
      provider: 'github',
      code: 'valid_github_code',
    };

    const result = await oauth(input);

    // Verify AuthUser type - should not include sensitive fields
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('provider');
    expect(result).not.toHaveProperty('provider_id');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');

    // Should only have AuthUser fields
    expect(Object.keys(result)).toEqual(['id', 'email', 'name', 'avatar_url']);
  });
});
