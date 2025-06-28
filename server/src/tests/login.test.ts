
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/auth/login';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

const testUserOAuth = {
  email: 'oauth@example.com',
  name: 'OAuth User',
  provider: 'google',
  provider_id: 'google123',
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create user with password stored as plain text (for testing)
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: testUser.password, // Storing plain text for testing
        provider: 'email',
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUser.email,
      password: testUser.password,
    };

    const result = await login(loginInput);

    expect(result.email).toEqual(testUser.email);
    expect(result.name).toEqual(testUser.name);
    expect(result.id).toBeDefined();
    expect(result.avatar_url).toBeNull();
  });

  it('should reject login with invalid email', async () => {
    // Create user with password
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: testUser.password,
        provider: 'email',
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: testUser.password,
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with invalid password', async () => {
    // Create user with password
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: testUser.password,
        provider: 'email',
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUser.email,
      password: 'wrongpassword',
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login for OAuth users without password', async () => {
    // Create OAuth user without password hash
    await db.insert(usersTable)
      .values({
        email: testUserOAuth.email,
        name: testUserOAuth.name,
        provider: testUserOAuth.provider,
        provider_id: testUserOAuth.provider_id,
        password_hash: null,
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUserOAuth.email,
      password: 'anypassword',
    };

    await expect(login(loginInput)).rejects.toThrow(/registered with oauth/i);
  });

  it('should handle user with all optional fields populated', async () => {
    // Create user with all fields
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        avatar_url: 'https://example.com/avatar.jpg',
        password_hash: testUser.password,
        provider: 'email',
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUser.email,
      password: testUser.password,
    };

    const result = await login(loginInput);

    expect(result.email).toEqual(testUser.email);
    expect(result.name).toEqual(testUser.name);
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.id).toBeDefined();
  });
});
