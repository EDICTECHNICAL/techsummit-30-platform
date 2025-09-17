import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { teamInvites, teams, teamMembers, user } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Send team invite
export async function POST(request: NextRequest) {
  try {
    // TODO: Replace with real authentication logic
    const session = { user: { id: 'test-user-id' } };

    const { teamId, email } = await request.json();
    
    if (!teamId || !email) {
      return NextResponse.json({ 
        error: 'Team ID and email are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
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
        error: 'Only team leaders can send invites', 
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    // Check team member count (max 5 including leader)
    const memberCount = await db
      .select({ count: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    if (memberCount.length >= 5) {
      return NextResponse.json({ 
        error: 'Team already has maximum 5 members', 
        code: 'TEAM_FULL' 
      }, { status: 400 });
    }

    // Check if user is already a team member
    const existingUser = await db
      .select()
      .from(user)
        .where(eq(user.username, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      const existingMember = await db
        .select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, existingUser[0].id)
        ))
        .limit(1);

      if (existingMember.length > 0) {
        return NextResponse.json({ 
          error: 'User is already a team member', 
          code: 'ALREADY_MEMBER' 
        }, { status: 409 });
      }
    }

    // Check for existing pending invite
    const existingInvite = await db
      .select()
      .from(teamInvites)
      .where(and(
        eq(teamInvites.teamId, teamId),
          eq(teamInvites.email, email.toLowerCase().trim()),
        eq(teamInvites.status, 'PENDING')
      ))
      .limit(1);

    if (existingInvite.length > 0) {
      return NextResponse.json({ 
        error: 'Invite already sent to this email', 
        code: 'INVITE_EXISTS' 
      }, { status: 409 });
    }

    // Create invite
      const newInvite = await db.insert(teamInvites).values([
        {
          teamId,
          email: email.toLowerCase().trim(),
          status: 'PENDING',
          createdAt: new Date(),
        }
      ]).returning();

    return NextResponse.json(newInvite[0], { status: 201 });
  } catch (error) {
    console.error('POST team invite error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// GET handler - List team invites (for team leaders)
export async function GET(request: NextRequest) {
  try {
  // TODO: Replace with real authentication logic
  const session = { user: { id: 'test-user-id' } };
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Verify user is team leader
      const isLeader = await db
        .select()
        .from(teamMembers)
        .where(and(
          eq(teamMembers.teamId, parseInt(teamId)),
          eq(teamMembers.userId, session.user.id),
          eq(teamMembers.role, 'LEADER')
        ))
        .limit(1);

      if (isLeader.length === 0) {
        return NextResponse.json({ 
          error: 'Only team leaders can view team invites', 
          code: 'UNAUTHORIZED' 
        }, { status: 403 });
      }

      const invites = await db
        .select()
        .from(teamInvites)
        .where(eq(teamInvites.teamId, parseInt(teamId)));

      return NextResponse.json(invites);
    } else {
      // Get all invites for user's email
      // No user email available, so return empty array or adjust logic as needed
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('GET team invites error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}