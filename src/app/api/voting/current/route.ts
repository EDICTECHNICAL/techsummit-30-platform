import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, rounds } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// POST handler - Cast vote (Authenticated users during voting round)
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authUser = await requireAuth(request);
    
    const { fromTeamId, toTeamId, value } = await request.json();
    
    if (!fromTeamId || !toTeamId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ 
        error: 'From team ID, to team ID, and valid vote value (+1 or -1) are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user belongs to the fromTeam or is admin
    if (!authUser.isAdmin && (!authUser.team || authUser.team.id !== fromTeamId)) {
      return NextResponse.json({ 
        error: 'You can only vote on behalf of your own team', 
        code: 'UNAUTHORIZED_TEAM' 
      }, { status: 403 });
    }

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

    return NextResponse.json({
      success: true,
      vote: newVote[0],
      message: `Vote ${value === 1 ? 'Yes' : 'No'} recorded successfully`
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST votes error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// GET handler - Get voting statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const fromTeamId = searchParams.get('fromTeamId');

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
    }

    if (fromTeamId) {
      // Get votes cast by specific team (for checking what they've already voted on)
      const votesFromTeam = await db
        .select()
        .from(votes)
        .where(eq(votes.fromTeamId, parseInt(fromTeamId)))
        .orderBy(votes.createdAt);

      const downvoteCount = votesFromTeam.filter(v => v.value === -1).length;

      return NextResponse.json({
        fromTeamId: parseInt(fromTeamId),
        votescast: votesFromTeam,
        downvoteCount,
        remainingDownvotes: Math.max(0, 3 - downvoteCount),
        votedTeams: votesFromTeam.map(v => v.toTeamId)
      });
    }

    // Get all votes summary
    const allVotes = await db
      .select()
      .from(votes)
      .orderBy(votes.createdAt);

    return NextResponse.json(allVotes);

  } catch (error) {
    console.error('GET votes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}