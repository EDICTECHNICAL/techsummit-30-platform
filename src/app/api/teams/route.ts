import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { teams, user } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// GET handler - List all teams with members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get teams with member details
    const teamsWithMembers = await db
      .select({
        id: teams.id,
        name: teams.name,
        college: teams.college,
        createdAt: teams.createdAt,
        leaderId: teams.leaderId,
      })
      .from(teams)
      .limit(limit)
      .offset(offset);

    // Structure response with leader info only
    const teamsWithLeader = await Promise.all(teamsWithMembers.map(async (team) => {
      // Fetch leader user info
      const leader = team.leaderId
        ? await db.select().from(user).where(eq(user.id, team.leaderId)).limit(1)
        : [];
      return {
        id: team.id,
        name: team.name,
        college: team.college,
        createdAt: team.createdAt,
        leader: leader[0] ? { userId: leader[0].id, name: leader[0].name, username: leader[0].username } : null,
      };
    }));
    return NextResponse.json(teamsWithLeader);
  } catch (error) {
    console.error('GET teams error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST handler - Create new team
export async function POST(request: NextRequest) {
  try {
  // TODO: Replace with real authentication logic
  // Use a valid user ID from your seed data for testing
  const session = { user: { id: 'user_02h4kyu3f0a8z4c2d8e7f6g9s2' } }; // e.g. Alice Johnson

    const { name, college } = await request.json();
    
    // Validate required fields
    if (!name || !college) {
      return NextResponse.json({ 
        error: 'Name and college are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Check if user is already a team leader
    const existingLeadership = await db
      .select()
      .from(teams)
      .where(eq(teams.leaderId, session.user.id))
      .limit(1);

    if (existingLeadership.length > 0) {
      return NextResponse.json({ 
        error: 'User is already a team leader', 
        code: 'ALREADY_LEADER' 
      }, { status: 409 });
    }

    // Create team with user as leader
    const newTeam = await db.insert(teams).values([
      {
        name: name.trim(),
        college: college.trim(),
        leaderId: session.user.id,
      }
    ]).returning();

    return NextResponse.json(newTeam[0], { status: 201 });
  } catch (error) {
    console.error('POST teams error:', error);
    // Handle unique constraint violations
    if (typeof error === 'object' && error && 'message' in error && typeof (error as any).message === 'string' && (error as any).message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Team name already exists', 
        code: 'DUPLICATE_TEAM_NAME' 
      }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error: ' + String(error) }, { status: 500 });
  }
}