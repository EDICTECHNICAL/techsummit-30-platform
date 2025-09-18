import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tokenConversions, quizSubmissions, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth-middleware';

// POST handler - Convert tokens to votes (Authenticated users during voting round)
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const authUser = await requireAuth(request);

    const { teamId } = await request.json();
    if (!teamId) {
      return NextResponse.json({ 
        error: 'Team ID is required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user belongs to the team or is admin
    if (!authUser.isAdmin && (!authUser.team || authUser.team.id !== teamId)) {
      return NextResponse.json({ 
        error: 'You can only convert tokens for your own team', 
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
        error: 'Insufficient tokens: need at least 1 in each category (Marketing, Capital, Team, Strategy)', 
        code: 'INSUFFICIENT_TOKENS',
        currentTokens: available
      }, { status: 400 });
    }

    // Create token conversion record
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
      success: true,
      conversion: newConversion[0],
      tokensUsed: 4,
      votesGained: 1,
      availableTokens: available,
      message: 'Successfully converted 1 token from each category → 1 vote'
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST token conversion error:', error);
    
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

    // Check if team can convert tokens
    const canConvert = conversions.length === 0 && 
                      availableTokens.marketing >= 1 && 
                      availableTokens.capital >= 1 && 
                      availableTokens.team >= 1 && 
                      availableTokens.strategy >= 1;

    return NextResponse.json({
      teamId: parseInt(teamId),
      conversions: conversions,
      availableTokens: availableTokens,
      totalVotesGained: totalVotesGained,
      canConvert: canConvert,
      hasQuizSubmission: quizSubmission.length > 0,
    });

  } catch (error) {
    console.error('GET token conversions error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}