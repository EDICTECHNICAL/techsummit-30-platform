import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
  team: {
    id: number;
    name: string;
    college: string;
  } | null;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie first
    let token = request.cookies.get('auth-token')?.value;
    
    // If no cookie token, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId) {
      return null;
    }

    // Get current user info from database
    const foundUsers = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
      })
      .from(user)
      .where(eq(user.id, decoded.userId))
      .limit(1);

    if (foundUsers.length === 0) {
      return null;
    }

    const foundUser = foundUsers[0];

    // Get user's team information
    const userTeam = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
      })
      .from(teams)
      .where(eq(teams.name, foundUser.name))
      .limit(1);

    return {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      isAdmin: foundUser.isAdmin,
      team: userTeam.length > 0 ? {
        id: userTeam[0].teamId,
        name: userTeam[0].teamName,
        college: userTeam[0].college,
      } : null
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await authenticateRequest(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

export async function requireTeamMember(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!user.team) {
    throw new Error('Team membership required');
  }
  return user;
}