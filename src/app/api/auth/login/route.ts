import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        error: 'Username and password are required' 
      }, { status: 400 });
    }

    // Find user by username (case insensitive)
    const foundUsers = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        password: user.password,
        isAdmin: user.isAdmin,
      })
      .from(user)
      .where(eq(user.username, username.trim().toLowerCase()))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid username or password' 
      }, { status: 401 });
    }

    const foundUser = foundUsers[0];

    // Verify password
    const isPasswordValid = compareSync(password, foundUser.password);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Invalid username or password' 
      }, { status: 401 });
    }

    // Get user's team information (first team by username)
    const userTeam = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
      })
      .from(teams)
      .where(eq(teams.name, foundUser.name))
      .limit(1);

    // Create JWT token
    const tokenPayload = { 
      userId: foundUser.id, 
      username: foundUser.username,
      isAdmin: foundUser.isAdmin,
      teamId: userTeam[0]?.teamId || null,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Prepare user response
    const userResponse = {
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

    // Create response with secure httpOnly cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Login successful',
      user: userResponse,
      token // Also return token for client-side storage if needed
    });

    // Set httpOnly cookie for server-side authentication
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Login failed. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Check authentication status
export async function GET(req: NextRequest) {
  try {
    // Try to get token from cookie
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
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
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    const foundUser = foundUsers[0];


    // Get user's current team information (first team where user is leader)
    const userTeam = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
      })
      .from(teams)
  .where(eq(teams.name, foundUser.name))
      .limit(1);

    const userResponse = {
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

    return NextResponse.json({ 
      authenticated: true,
      user: userResponse 
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      user: null 
    });
  }
}