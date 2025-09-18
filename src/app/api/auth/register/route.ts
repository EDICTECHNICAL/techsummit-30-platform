import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, teamName, college } = await req.json();
    
    // Validate required fields
    if (!username || !password || !name || !teamName || !college) {
      return NextResponse.json({ 
        error: 'All fields are required (username, password, name, teamName, college)' 
      }, { status: 400 });
    }

    // Validate input lengths and format
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: 'Username must be between 3-50 characters' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be less than 100 characters' }, { status: 400 });
    }
    if (teamName.length > 100) {
      return NextResponse.json({ error: 'Team name must be less than 100 characters' }, { status: 400 });
    }
    if (college.length > 200) {
      return NextResponse.json({ error: 'College name must be less than 200 characters' }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username.trim().toLowerCase()));
      
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Check if team name already exists
    const existingTeam = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.name, teamName.trim()));
      
    if (existingTeam.length > 0) {
      return NextResponse.json({ error: 'Team name already taken' }, { status: 409 });
    }

    // Generate unique user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Hash password
    const hashedPassword = hashSync(password, 12);

    // Start a transaction to create user, team, and team membership
    const newUser = await db.insert(user).values({
      id: userId,
      username: username.trim().toLowerCase(),
      name: name.trim(),
      password: hashedPassword,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create team (no leaderId)
    const newTeam = await db.insert(teams).values({
      name: teamName.trim(),
      college: college.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();


    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        name: newUser[0].name,
      },
      team: {
        id: newTeam[0].id,
        name: newTeam[0].name,
        college: newTeam[0].college,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('UNIQUE constraint failed')) {
        if (errorMessage.includes('username')) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
        if (errorMessage.includes('name')) {
          return NextResponse.json({ error: 'Team name already taken' }, { status: 409 });
        }
      }
    }
    
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}