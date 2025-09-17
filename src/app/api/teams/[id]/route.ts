import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, teamMembers, user } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// GET handler - Get single team by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const teamId = parseInt(params.id);
    
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ 
        error: 'Valid team ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Get team with member details
    const teamWithMembers = await db
      .select({
        id: teams.id,
        name: teams.name,
        college: teams.college,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberName: user.name,
        memberEmail: user.email,
        memberRole: teamMembers.role,
        userId: user.id,
      })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .leftJoin(user, eq(teamMembers.userId, user.id))
      .where(eq(teams.id, teamId));

    if (teamWithMembers.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Structure response
    const teamData = teamWithMembers[0];
    const result = {
      id: teamData.id,
      name: teamData.name,
      college: teamData.college,
      createdAt: teamData.createdAt,
      updatedAt: teamData.updatedAt,
      members: [],
      memberCount: 0,
      leader: null,
    };

    for (const row of teamWithMembers) {
      if (row.memberName) {
        const member = {
          name: row.memberName,
          email: row.memberEmail,
          role: row.memberRole,
          userId: row.userId,
        };
        result.members.push(member);
        result.memberCount++;
        
        if (row.memberRole === 'LEADER') {
          result.leader = member;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET team error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// PATCH handler - Update team (leader only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const teamId = parseInt(params.id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ 
        error: 'Valid team ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Verify user is team leader
    const isLeader = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id),
        eq(teamMembers.role, 'LEADER')
      ))
      .limit(1);

    if (isLeader.length === 0) {
      return NextResponse.json({ 
        error: 'Only team leaders can update team details', 
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    const updates = await request.json();
    const allowedFields = ['name', 'college'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value) {
        filteredUpdates[key] = typeof value === 'string' ? value.trim() : value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update', 
        code: 'NO_VALID_FIELDS' 
      }, { status: 400 });
    }

    const updatedTeam = await db
      .update(teams)
      .set({
        ...filteredUpdates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (updatedTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTeam[0]);
  } catch (error) {
    console.error('PATCH team error:', error);
    
    if (error.message?.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Team name already exists', 
        code: 'DUPLICATE_TEAM_NAME' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// DELETE handler - Delete team (leader only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const teamId = parseInt(params.id);
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ 
        error: 'Valid team ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Verify user is team leader
    const isLeader = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id),
        eq(teamMembers.role, 'LEADER')
      ))
      .limit(1);

    if (isLeader.length === 0) {
      return NextResponse.json({ 
        error: 'Only team leaders can delete teams', 
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    // Delete team (cascade will handle team_members)
    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    if (deletedTeam.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Team successfully deleted', 
      team: deletedTeam[0] 
    });
  } catch (error) {
    console.error('DELETE team error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}