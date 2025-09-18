import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tokenConversions, teamMembers, quizSubmissions, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Convert tokens to votes (Team leaders only during voting round)
export async function POST(request: NextRequest) {
  try {

    // Get user ID from Authorization header (bearer token)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Decode user info from localStorage (frontend stores user in localStorage)
        // In production, decode JWT or session from the token
        const userRaw = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString('utf-8');
        const userObj = JSON.parse(userRaw);
        userId = userObj?.id || userObj?.user?.id || null;
      } catch {
        userId = null;
      }
    }
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }


    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user is team leader
    const isLeader = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.role, 'LEADER')
      ))
      .limit(1);

    if (isLeader.length === 0) {
      return NextResponse.json({ 
        error: 'Only team leaders can convert tokens', 
        code: 'LEADER_REQUIRED' 
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


    // Check if team has already converted tokens (only allow once per team)
    const existingConversion = await db
      .select()
      .from(tokenConversions)
      .where(eq(tokenConversions.teamId, teamId))
      .limit(1);

    if (existingConversion.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already converted tokens', 
        code: 'ALREADY_CONVERTED' 
      }, { status: 409 });
    }

    // Get team's quiz submission to check available tokens
    const quizSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, teamId))
      .limit(1);

    if (quizSubmission.length === 0) {
      return NextResponse.json({ 
        error: 'Team has not completed quiz yet', 
        code: 'NO_QUIZ_SUBMISSION' 
      }, { status: 400 });
    }

    const submission = quizSubmission[0];
    const available = {
      marketing: submission.tokensMarketing,
      capital: submission.tokensCapital,
      team: submission.tokensTeam,
      strategy: submission.tokensStrategy,
    };

    // Require at least 1 token in each category
    if (available.marketing < 1 || available.capital < 1 || available.team < 1 || available.strategy < 1) {
      return NextResponse.json({ 
        error: 'Insufficient tokens: need 1 in each category', 
        code: 'INSUFFICIENT_TOKENS' 
      }, { status: 400 });
    }

    // Deduct 1 token from each category and grant 1 vote
    // (You may want to update the quizSubmissions table here to reflect token deduction)
    // For now, just record the conversion
    const newConversion = await db.insert(tokenConversions).values([
      {
        teamId: teamId,
        category: 'ALL',
        tokensUsed: 4,
        votesGained: 1,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json({
      conversion: newConversion[0],
      tokensUsed: 4,
      votesGained: 1,
      availableTokens: available,
    }, { status: 201 });
  } catch (error) {
    console.error('POST token conversion error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// GET handler - Get token conversion status for team
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_TEAM_ID' 
      }, { status: 400 });
    }

    // Get team's conversions
    const conversions = await db
      .select()
      .from(tokenConversions)
      .where(eq(tokenConversions.teamId, parseInt(teamId)));

    // Get team's quiz submission for available tokens
    const quizSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, parseInt(teamId)))
      .limit(1);

    const availableTokens = quizSubmission.length > 0 ? {
      marketing: quizSubmission[0].tokensMarketing,
      capital: quizSubmission[0].tokensCapital,
      team: quizSubmission[0].tokensTeam,
      strategy: quizSubmission[0].tokensStrategy,
    } : {
      marketing: 0,
      capital: 0,
      team: 0,
      strategy: 0,
    };

    // Calculate total votes gained from conversions
    const totalVotesGained = conversions.reduce((sum, conv) => sum + conv.votesGained, 0);

    return NextResponse.json({
      teamId: parseInt(teamId),
      conversions: conversions,
      availableTokens: availableTokens,
      totalVotesGained: totalVotesGained,
    });
  } catch (error) {
    console.error('GET token conversions error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}