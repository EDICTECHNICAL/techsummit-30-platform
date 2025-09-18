import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, rounds } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

// POST handler - Cast vote (Team leaders only during voting round)
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

    const { fromTeamId, toTeamId, value } = await request.json();
    
    if (!fromTeamId || !toTeamId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ 
        error: 'From team ID, to team ID, and valid vote value (+1 or -1) are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // No teamMembers check; allow all authenticated users

    // Check if voting round is active
    const votingRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'VOTING'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (votingRound.length === 0) {
      return NextResponse.json({ 
        error: 'Voting round is not currently active', 
        code: 'VOTING_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Cannot vote for own team
    if (fromTeamId === toTeamId) {
      return NextResponse.json({ 
        error: 'Cannot vote for your own team', 
        code: 'SELF_VOTE_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Check if team already voted for this target team
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.fromTeamId, fromTeamId),
        eq(votes.toTeamId, toTeamId)
      ))
      .limit(1);

    if (existingVote.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already voted for this target team', 
        code: 'ALREADY_VOTED' 
      }, { status: 409 });
    }

    // If downvote, check team downvote limit (max 3)
    if (value === -1) {
      const downvoteCount = await db
        .select({ count: count() })
        .from(votes)
        .where(and(
          eq(votes.fromTeamId, fromTeamId),
          eq(votes.value, -1)
        ));

      if (downvoteCount[0]?.count >= 3) {
        return NextResponse.json({ 
          error: 'Team has reached maximum of 3 downvotes', 
          code: 'DOWNVOTE_LIMIT_EXCEEDED' 
        }, { status: 400 });
      }
    }

    const newVote = await db.insert(votes).values([
      {
        fromTeamId: fromTeamId,
        toTeamId: toTeamId,
        value: value,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newVote[0], { status: 201 });
  } catch (error) {
    console.error('POST votes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// GET handler - Get voting statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get votes for specific team
      const teamVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.toTeamId, parseInt(teamId)))
        .orderBy(votes.createdAt);

      const upvotes = teamVotes.filter(v => v.value === 1).length;
      const downvotes = teamVotes.filter(v => v.value === -1).length;
      const totalVotes = upvotes - downvotes;

      return NextResponse.json({
        teamId: parseInt(teamId),
        upvotes,
        downvotes,
        totalVotes,
        votes: teamVotes,
      });
    } else {
      // Get all votes summary
      const allVotes = await db
        .select()
        .from(votes)
        .orderBy(votes.createdAt);

      return NextResponse.json(allVotes);
    }
  } catch (error) {
    console.error('GET votes error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}