import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { peerRatings, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Submit peer rating (Team leaders only during final round)
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

    const { fromTeamId, toTeamId, rating } = await request.json();
    
    if (!fromTeamId || !toTeamId || rating === undefined) {
      return NextResponse.json({ 
        error: 'From team ID, to team ID, and rating are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate rating range (3-10)
    if (rating < 3 || rating > 10 || !Number.isInteger(rating)) {
      return NextResponse.json({ 
        error: 'Rating must be an integer between 3 and 10', 
        code: 'INVALID_RATING' 
      }, { status: 400 });
    }

    // No leader check; allow any authenticated user

    // Check if final round is active
    const finalRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'FINAL'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (finalRound.length === 0) {
      return NextResponse.json({ 
        error: 'Final round is not currently active', 
        code: 'FINAL_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Cannot rate own team
    if (fromTeamId === toTeamId) {
      return NextResponse.json({ 
        error: 'Cannot rate your own team', 
        code: 'SELF_RATING_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Check if team already rated this target team
    const existingRating = await db
      .select()
      .from(peerRatings)
      .where(and(
        eq(peerRatings.fromTeamId, fromTeamId),
        eq(peerRatings.toTeamId, toTeamId)
      ))
      .limit(1);

    if (existingRating.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already rated this target team', 
        code: 'ALREADY_RATED' 
      }, { status: 409 });
    }

    const newRating = await db.insert(peerRatings).values([
      {
        fromTeamId: fromTeamId,
        toTeamId: toTeamId,
        rating: rating,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newRating[0], { status: 201 });
  } catch (error) {
    console.error('POST peer rating error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// GET handler - Get peer ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get ratings for specific team
      const teamRatings = await db
        .select()
        .from(peerRatings)
        .where(eq(peerRatings.toTeamId, parseInt(teamId)))
        .orderBy(peerRatings.createdAt);

      const averageRating = teamRatings.length > 0 
        ? teamRatings.reduce((sum, r) => sum + r.rating, 0) / teamRatings.length 
        : 0;

      return NextResponse.json({
        teamId: parseInt(teamId),
        ratings: teamRatings,
        averageRating: Math.round(averageRating * 100) / 100,
        ratingCount: teamRatings.length,
      });
    } else {
      // Get all peer ratings
      const allRatings = await db
        .select()
        .from(peerRatings)
        .orderBy(peerRatings.createdAt);

      return NextResponse.json(allRatings);
    }
  } catch (error) {
    console.error('GET peer ratings error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}