import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teamInvites } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// POST handler - Decline team invite
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
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
        eq(teamInvites.email, session.user.email),
        eq(teamInvites.status, 'PENDING')
      ))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired invite', 
        code: 'INVALID_INVITE' 
      }, { status: 404 });
    }

    // Update invite status to declined
    const updatedInvite = await db
      .update(teamInvites)
      .set({ status: 'DECLINED' })
      .where(eq(teamInvites.id, inviteId))
      .returning();

    return NextResponse.json({ 
      message: 'Successfully declined team invite',
      invite: updatedInvite[0] 
    });
  } catch (error) {
    console.error('POST decline invite error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}