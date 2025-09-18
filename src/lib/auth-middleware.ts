
// src/lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from '@/db';
import { user, teamMembers, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface TokenPayload extends JwtPayload {
  userId?: string;
  username?: string;
  isAdmin?: boolean;
  teamId?: number | null;
}

/**
 * Authenticates a request using JWT or legacy base64 user data.
 * Returns AuthUser or null if authentication fails.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Try to get token from cookie first
    let token = req.cookies.get('auth-token')?.value;

    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');

        // Handle base64 encoded user data (for compatibility)
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const userData = JSON.parse(decoded);
          if (userData?.id) {
            // This is direct user data, validate it exists in DB
            const foundUsers = await db
              .select({
                id: user.id,
                username: user.username,
                name: user.name,
                isAdmin: user.isAdmin,
              })
              .from(user)
              .where(eq(user.id, userData.id))
              .limit(1);

            if (foundUsers.length > 0) {
              const foundUser = foundUsers[0];

              // Get user's team information
              const userTeam = await db
                .select({
                  teamId: teams.id,
                  teamName: teams.name,
                  college: teams.college,
                  role: teamMembers.role,
                })
                .from(teamMembers)
                .leftJoin(teams, eq(teamMembers.teamId, teams.id))
                .where(eq(teamMembers.userId, foundUser.id))
                .limit(1);

              return {
                id: foundUser.id,
                username: foundUser.username,
                name: foundUser.name,
                isAdmin: foundUser.isAdmin,
                team: userTeam.length > 0 && userTeam[0].teamId != null && userTeam[0].teamName != null && userTeam[0].college != null ? {
                  id: userTeam[0].teamId,
                  name: userTeam[0].teamName,
                  college: userTeam[0].college,
                  role: userTeam[0].role,
                } : null
              };
            }
          }
        } catch {
          // Not base64 encoded, treat as JWT token
        }
      }
    }

    if (!token) {
      return null;
    }

    // Verify JWT token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      console.error('JWT verification failed:', err);
      return null;
    }

    if (!decoded.userId) {
      console.error('JWT payload missing userId');
      return null;
    }

    // Get user from database
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
      console.error('User not found for userId:', decoded.userId);
      return null;
    }

    const foundUser = foundUsers[0];

    // Get user's team information
    const userTeam = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, foundUser.id))
      .limit(1);

    return {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      isAdmin: foundUser.isAdmin,
      team: userTeam.length > 0 && userTeam[0].teamId != null && userTeam[0].teamName != null && userTeam[0].college != null ? {
        id: userTeam[0].teamId,
        name: userTeam[0].teamName,
        college: userTeam[0].college,
        role: userTeam[0].role,
      } : null
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Throws if authentication fails, otherwise returns AuthUser.
 */
export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await authenticateRequest(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Throws if user is not a team leader.
 */
export async function requireLeader(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (!user.team || user.team.role !== 'LEADER') {
    throw new Error('Team leader access required');
  }
  return user;
}

/**
 * Throws if user is not an admin.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}