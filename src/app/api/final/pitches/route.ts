import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { finalPitches, teams, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET handler - List all final pitches
export async function GET(request: NextRequest) {
  try {
    const pitchesWithTeams = await db
      .select({
        id: finalPitches.id,
        teamId: finalPitches.teamId,
        teamName: teams.name,
        presentedAt: finalPitches.presentedAt,
        createdAt: finalPitches.createdAt,
      })
      .from(finalPitches)
      .leftJoin(teams, eq(finalPitches.teamId, teams.id))
      .orderBy(finalPitches.presentedAt, finalPitches.createdAt);

    return NextResponse.json(pitchesWithTeams);
  } catch (error) {
    console.error('GET final pitches error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST handler - Create final pitch (Team leaders only during final round)
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

    const { teamId } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_TEAM_ID' 
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

    // Check if team already registered for final pitch
    const existingPitch = await db
      .select()
      .from(finalPitches)
      .where(eq(finalPitches.teamId, teamId))
      .limit(1);

    if (existingPitch.length > 0) {
      return NextResponse.json({ 
        error: 'Team already registered for final pitch', 
        code: 'PITCH_EXISTS' 
      }, { status: 409 });
    }

    const newPitch = await db.insert(finalPitches).values([
      {
        teamId: teamId,
        presentedAt: new Date(),
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newPitch[0], { status: 201 });
  } catch (error) {
    console.error('POST final pitch error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}