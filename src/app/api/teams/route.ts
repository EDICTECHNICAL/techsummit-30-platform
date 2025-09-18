import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { teams, user, teamMembers } from '../../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth-middleware';

// GET handler - List all teams with basic info (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get teams with leader and member count
    const teamsWithInfo = await db
      .select({
        id: teams.id,
        name: teams.name,
        college: teams.college,
        createdAt: teams.createdAt,
        leaderId: teams.leaderId,
        leaderName: user.name,
        leaderUsername: user.username,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${teamMembers} 
          WHERE ${teamMembers.teamId} = ${teams.id}
        )`
      })
      .from(teams)
      .leftJoin(user, eq(teams.leaderId, user.id))
      .orderBy(teams.createdAt)
      .limit(limit)
      .offset(offset);

    // Format response
    const formattedTeams = teamsWithInfo.map(team => ({
      id: team.id,
      name: team.name,
      college: team.college,
      createdAt: team.createdAt,
      memberCount: team.memberCount || 0,
      leader: team.leaderId ? {
        userId: team.leaderId,
        name: team.leaderName,
        username: team.leaderUsername
      } : null
    }));

    return NextResponse.json(formattedTeams);

  } catch (error) {
    console.error('GET teams error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch teams', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST handler - Create new team (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateRequest(request);
    
    if (!authUser) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const { name, college } = await request.json();
    
    // Validate required fields
    if (!name || !college) {
      return NextResponse.json({ 
        error: 'Team name and college are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate field lengths
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ 
        error: 'Team name must be between 2-100 characters', 
        code: 'INVALID_NAME_LENGTH' 
      }, { status: 400 });
    }

    if (college.trim().length < 2 || college.trim().length > 200) {
      return NextResponse.json({ 
        error: 'College name must be between 2-200 characters', 
        code: 'INVALID_COLLEGE_LENGTH' 
      }, { status: 400 });
    }

    // Check if user is already a team leader
    const existingLeadership = await db
      .select()
      .from(teams)
      .where(eq(teams.leaderId, authUser.id))
      .limit(1);

    if (existingLeadership.length > 0) {
      return NextResponse.json({ 
        error: 'You are already a team leader. You can only lead one team.', 
        code: 'ALREADY_LEADER' 
      }, { status: 409 });
    }

    // Check if user is already a member of another team
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, authUser.id))
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({ 
        error: 'You are already a member of another team. Leave your current team first.', 
        code: 'ALREADY_MEMBER' 
      }, { status: 409 });
    }

    // Check if team name already exists
    const existingTeamName = await db
      .select()
      .from(teams)
      .where(eq(teams.name, name.trim()))
      .limit(1);

    if (existingTeamName.length > 0) {
      return NextResponse.json({ 
        error: 'Team name already exists. Please choose a different name.', 
        code: 'DUPLICATE_TEAM_NAME' 
      }, { status: 409 });
    }

    // Create team with user as leader
    const newTeam = await db.insert(teams).values({
      name: name.trim(),
      college: college.trim(),
      leaderId: authUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Add user as team leader in team_members table
    await db.insert(teamMembers).values({
      teamId: newTeam[0].id,
      userId: authUser.id,
      role: 'LEADER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: newTeam[0].id,
      name: newTeam[0].name,
      college: newTeam[0].college,
      createdAt: newTeam[0].createdAt,
      memberCount: 1,
      leader: {
        userId: authUser.id,
        name: authUser.name,
        username: authUser.username
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST teams error:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    // Handle database constraint violations
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage.includes('UNIQUE constraint failed')) {
        if (errorMessage.includes('name')) {
          return NextResponse.json({ 
            error: 'Team name already exists', 
            code: 'DUPLICATE_TEAM_NAME' 
          }, { status: 409 });
        }
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create team', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}