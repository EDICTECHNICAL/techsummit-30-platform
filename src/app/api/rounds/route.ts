import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rounds, userRoles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET handler - List all rounds
export async function GET(request: NextRequest) {
  try {
    const allRounds = await db
      .select()
      .from(rounds)
      .orderBy(rounds.day, rounds.id);

    return NextResponse.json(allRounds);
  } catch (error) {
    console.error('GET rounds error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// PATCH handler - Update round status (Admin only)
export async function PATCH(request: NextRequest) {
  try {
  // TODO: Replace with real authentication logic
  const session = { user: { id: 'test-user-id' } };
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    // Verify user is admin
    const isAdmin = await db
      .select()
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, session.user.id),
        eq(userRoles.role, 'ADMIN')
      ))
      .limit(1);

    if (isAdmin.length === 0) {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    const { roundId, status, startsAt, endsAt } = await request.json();
    
    if (!roundId) {
      return NextResponse.json({ 
        error: 'Round ID is required', 
        code: 'MISSING_ROUND_ID' 
      }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be PENDING, ACTIVE, or COMPLETED', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (status) updateData.status = status;
    if (startsAt) updateData.startsAt = startsAt;
    if (endsAt) updateData.endsAt = endsAt;

    const updatedRound = await db
      .update(rounds)
      .set(updateData)
      .where(eq(rounds.id, roundId))
      .returning();

    if (updatedRound.length === 0) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    return NextResponse.json(updatedRound[0]);
  } catch (error) {
    console.error('PATCH rounds error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}