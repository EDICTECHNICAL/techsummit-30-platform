import { NextRequest, NextResponse } from 'next/server';

// In-memory state for demo (replace with DB in production)

type VotingTeam = { id: string | number; name: string } | null;
let votingState: {
  team: VotingTeam;
  votingActive: boolean;
  allPitchesCompleted: boolean;
} = {
  team: null,
  votingActive: false,
  allPitchesCompleted: false,
};

export async function GET(request: NextRequest) {
  return NextResponse.json(votingState);
}

export async function POST(request: NextRequest) {
  const { teamId, teamName } = await request.json();
  let name = teamName;
  // Try to get real team name from DB if not provided
  if (!name && teamId) {
    try {
      const { db } = await import('@/db');
      const { teams } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
      if (team.length > 0 && team[0].name) name = team[0].name;
    } catch {}
  }
  votingState.team = teamId && name ? { id: teamId, name } : null;
  votingState.votingActive = false;
  return NextResponse.json(votingState);
}

export async function PATCH(request: NextRequest) {
  const { votingActive, allPitchesCompleted } = await request.json();
  if (typeof votingActive === 'boolean') votingState.votingActive = votingActive;
  if (typeof allPitchesCompleted === 'boolean') votingState.allPitchesCompleted = allPitchesCompleted;
  return NextResponse.json(votingState);
}
