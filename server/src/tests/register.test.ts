
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput } from '../schema';
import { register } from '../handlers/auth/register';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: RegisterInput = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

describe('register', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await register(testInput);

    // Verify returned user data
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.name).toEqual('Test User');
    expect(result.user.avatar_url).toBeNull();
    expect(result.user.id).toBeDefined();
    expect(typeof result.user.id).toBe('string');
  });

  it('should save user to database with hashed password', async () => {
    const result = await register(testInput);

    // Query database to verify user was created
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    
    expect(user.email).toEqual('test@example.com');
    expect(user.name).toEqual('Test User');
    expect(user.provider).toEqual('email');
    expect(user.provider_id).toBeNull();
    expect(user.avatar_url).toBeNull();
    expect(user.password_hash).toBeDefined();
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);

    // Verify password was hashed correctly using Bun's built-in verify
    const isPasswordValid = await Bun.password.verify('password123', user.password_hash!);
    expect(isPasswordValid).toBe(true);
  });

  it('should register user without name field', async () => {
    const inputWithoutName: RegisterInput = {
      email: 'noname@example.com',
      password: 'password123'
    };

    const result = await register(inputWithoutName);

    expect(result.user.email).toEqual('noname@example.com');
    expect(result.user.name).toBeNull();
    expect(result.user.id).toBeDefined();
  });

  it('should throw error when user with email already exists', async () => {
    // Register first user
    await register(testInput);

    // Try to register user with same email
    const duplicateInput: RegisterInput = {
      email: 'test@example.com',
      password: 'differentpassword',
      name: 'Different User'
    };

    await expect(register(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should not expose password in returned data', async () => {
    const result = await register(testInput);

    // Verify password fields are not in returned object
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('password_hash');
  });

  it('should hash different passwords differently', async () => {
    const input1: RegisterInput = {
      email: 'user1@example.com',
      password: 'password123'
    };

    const input2: RegisterInput = {
      email: 'user2@example.com',
      password: 'differentpassword'
    };

    await register(input1);
    await register(input2);

    // Query both users
    const users = await db.select()
      .from(usersTable)
      .execute();

    expect(users).toHaveLength(2);
    expect(users[0].password_hash).not.toEqual(users[1].password_hash);
  });
});
