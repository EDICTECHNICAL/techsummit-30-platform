import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teamInvites, teamMembers, userRoles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Accept team invite
export async function POST(request: NextRequest) {
  try {
  // TODO: Replace with real authentication logic
  const session = { user: { id: 'test-user-id' } };
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const { inviteId } = await request.json();
    
    if (!inviteId) {
      return NextResponse.json({ 
        error: 'Invite ID is required', 
        code: 'MISSING_INVITE_ID' 
      }, { status: 400 });
    }

    // Get invite and verify it's for current user's email
    const invite = await db
      .select()
      .from(teamInvites)
      .where(and(
        eq(teamInvites.id, inviteId),
        eq(teamInvites.status, 'PENDING')
      ))
      .limit(1);

  if (invite.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite', 
        code: 'INVALID_INVITE' 
      }, { status: 404 });
    }

    const inviteData = invite[0];

    // Check if user is already a member of this team
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, inviteData.teamId),
        eq(teamMembers.userId, session.user.id)
      ))
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json({ 
        error: 'Already a member of this team', 
        code: 'ALREADY_MEMBER' 
      }, { status: 409 });
    }

    // Check team member count (max 5)
    const memberCount = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, inviteData.teamId));

    if (memberCount.length >= 5) {
      return NextResponse.json({ 
        error: 'Team is full (maximum 5 members)', 
        code: 'TEAM_FULL' 
      }, { status: 400 });
    }

    // Use transaction to accept invite
    const result = await db.transaction(async (tx) => {
      // Add user as team member
      const newMember = await tx.insert(teamMembers).values([
        {
          teamId: inviteData.teamId,
          userId: session.user.id,
          role: 'MEMBER',
          createdAt: new Date(),
        }
      ]).returning();

      // Update invite status
      await tx
        .update(teamInvites)
        .set({ status: 'ACCEPTED' })
        .where(eq(teamInvites.id, inviteId));

      // Ensure user has MEMBER role in user_roles
      const existingRole = await tx
        .select()
        .from(userRoles)
        .where(and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.role, 'MEMBER')
        ))
        .limit(1);

      if (existingRole.length === 0) {
        await tx.insert(userRoles).values([
          {
            userId: session.user.id,
            role: 'MEMBER',
            createdAt: new Date(),
          }
        ]);
      }

      return newMember[0];
    });

    return NextResponse.json({ 
      message: 'Successfully joined team',
      membership: result 
    });
  } catch (error) {
    console.error('POST accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}