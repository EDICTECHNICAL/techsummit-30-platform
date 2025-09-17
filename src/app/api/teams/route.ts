import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { teams, teamMembers, userRoles, user } from '../../../db/schema';
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
        memberName: user.name,
  // memberEmail removed, no email field in user table
        memberRole: teamMembers.role,
        userId: user.id,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .leftJoin(user, eq(teamMembers.userId, user.id))
      .limit(limit)
      .offset(offset);

    // Group by team and structure response
    const teamMap = new Map();
    
    for (const row of teamsWithMembers) {
      if (!teamMap.has(row.id)) {
        teamMap.set(row.id, {
          id: row.id,
          name: row.name,
          college: row.college,
          createdAt: row.createdAt,
          members: [],
          memberCount: 0,
          leader: null,
        });
      }
      
      const team = teamMap.get(row.id);
      if (row.memberName) {
        const member = {
          name: row.memberName,
          role: row.memberRole,
          userId: row.userId,
        };
        team.members.push(member);
        team.memberCount++;
        if (row.memberRole === 'LEADER') {
          team.leader = member;
        }
      }
    }

    const result = Array.from(teamMap.values());
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET teams error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST handler - Create new team
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with real authentication logic
    const session = { user: { id: 'test-user-id' } };

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
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, session.user.id), eq(teamMembers.role, 'LEADER')))
      .limit(1);

    if (existingLeadership.length > 0) {
      return NextResponse.json({ 
        error: 'User is already a team leader', 
        code: 'ALREADY_LEADER' 
      }, { status: 409 });
    }

    // Use transaction for multi-table operations
    const result = await db.transaction(async (tx) => {
      // Create team
      const newTeam = await tx.insert(teams).values([
        {
          name: name.trim(),
          college: college.trim(),
        }
      ]).returning();

      // Add creator as team leader
      await tx.insert(teamMembers).values([
        {
          teamId: newTeam[0].id,
          userId: session.user.id,
          role: 'LEADER',
        }
      ]);

      // Ensure user has LEADER role in user_roles
      const existingRole = await tx
        .select()
        .from(userRoles)
        .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, 'LEADER')))
        .limit(1);

      if (existingRole.length === 0) {
        await tx.insert(userRoles).values([
          {
            userId: session.user.id,
            role: 'LEADER',
          }
        ]);
      }

      return newTeam[0];
    });

    return NextResponse.json(result, { status: 201 });
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