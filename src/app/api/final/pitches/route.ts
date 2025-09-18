// src/app/api/final/pitches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { finalPitches, teams, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// GET handler - List all final pitches with team info
export async function GET(request: NextRequest) {
  try {
    const pitchesWithTeams = await db
      .select({
        id: finalPitches.id,
        teamId: finalPitches.teamId,
        teamName: teams.name,
        teamCollege: teams.college,
        presentedAt: finalPitches.presentedAt,
        createdAt: finalPitches.createdAt,
      })
      .from(finalPitches)
      .leftJoin(teams, eq(finalPitches.teamId, teams.id))
      .orderBy(finalPitches.presentedAt, finalPitches.createdAt);

    return NextResponse.json({
      pitches: pitchesWithTeams,
      count: pitchesWithTeams.length
    });
  } catch (error) {
    console.error('GET final pitches error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch final pitches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler - Register for final pitch (Authenticated users during final round)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authUser = await requireAuth(request);
    
    const { teamId } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_TEAM_ID' 
      }, { status: 400 });
    }

    // Verify user belongs to the team or is admin
    if (!authUser.isAdmin && (!authUser.team || authUser.team.id !== teamId)) {
      return NextResponse.json({ 
        error: 'You can only register final pitch for your own team', 
        code: 'UNAUTHORIZED_TEAM' 
      }, { status: 403 });
    }

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

    // Verify team exists
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return NextResponse.json({ 
        error: 'Team not found', 
        code: 'TEAM_NOT_FOUND' 
      }, { status: 404 });
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

    const newPitch = await db.insert(finalPitches).values({
      teamId: teamId,
      presentedAt: new Date(),
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      pitch: newPitch[0],
      message: `Team ${team[0].name} successfully registered for final pitch`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST final pitch error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      error: 'Failed to register final pitch',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}