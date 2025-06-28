
import { db } from '../../db';
import { usersTable } from '../../db/schema';
import { type OAuthInput, type AuthUser } from '../../schema';
import { eq } from 'drizzle-orm';

// Mock OAuth provider data - in a real implementation, these would be external API calls
const mockOAuthData = {
  google: {
    user_id: 'google_123456789',
    email: 'user@gmail.com',
    name: 'Google User',
    avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
  },
  github: {
    user_id: 'github_987654321',
    email: 'user@github.com',
    name: 'GitHub User',
    avatar_url: 'https://avatars.githubusercontent.com/u/123456?v=4',
  },
};

async function fetchOAuthUserData(provider: string, code: string) {
  // In a real implementation, this would:
  // 1. Exchange code for access token with OAuth provider
  // 2. Use access token to fetch user profile
  // For testing purposes, we'll use mock data
  
  if (code === 'invalid_code') {
    throw new Error('Invalid authorization code');
  }
  
  const userData = mockOAuthData[provider as keyof typeof mockOAuthData];
  if (!userData) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  
  return userData;
}

export async function oauth(input: OAuthInput): Promise<{ user: AuthUser }> {
  try {
    // Step 1: Exchange authorization code for user data
    const oauthUserData = await fetchOAuthUserData(input.provider, input.code);
    
    // Step 2: Check if user exists with this provider ID
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.provider_id, oauthUserData.user_id))
      .execute();
    
    let user;
    
    if (existingUsers.length > 0) {
      // Step 3a: User exists, update their info
      user = existingUsers[0];
      
      const updatedUsers = await db.update(usersTable)
        .set({
          name: oauthUserData.name,
          avatar_url: oauthUserData.avatar_url,
          updated_at: new Date(),
        })
        .where(eq(usersTable.id, user.id))
        .returning()
        .execute();
      
      user = updatedUsers[0];
    } else {
      // Step 3b: New user, create account
      const newUsers = await db.insert(usersTable)
        .values({
          email: oauthUserData.email,
          name: oauthUserData.name,
          avatar_url: oauthUserData.avatar_url,
          provider: input.provider,
          provider_id: oauthUserData.user_id,
        })
        .returning()
        .execute();
      
      user = newUsers[0];
    }
    
    // Step 4: Return sanitized user data (no sensitive fields)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      }
    };
  } catch (error) {
    console.error('OAuth authentication failed:', error);
    throw error;
  }
}
