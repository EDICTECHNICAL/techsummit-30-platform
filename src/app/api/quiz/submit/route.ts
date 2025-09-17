import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quizSubmissions, teamMembers, rounds, questions, options } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

// POST handler - Submit quiz (Team leaders only during active quiz round)
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

    const { teamId, answers, durationSeconds } = await request.json();
    
    if (!teamId || !answers || !Array.isArray(answers) || durationSeconds === undefined) {
      return NextResponse.json({ 
        error: 'Team ID, answers array, and duration are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Verify user is team leader
    const isLeader = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id),
        eq(teamMembers.role, 'LEADER')
      ))
      .limit(1);

    if (isLeader.length === 0) {
      return NextResponse.json({ 
        error: 'Only team leaders can submit quiz', 
        code: 'LEADER_REQUIRED' 
      }, { status: 403 });
    }

    // Check if quiz round is active
    const quizRound = await db
      .select()
      .from(rounds)
      .where(and(
        eq(rounds.name, 'QUIZ'),
        eq(rounds.status, 'ACTIVE')
      ))
      .limit(1);

    if (quizRound.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz round is not currently active', 
        code: 'QUIZ_NOT_ACTIVE' 
      }, { status: 400 });
    }

    // Validate time limit (30 minutes = 1800 seconds)
    if (durationSeconds > 1800) {
      return NextResponse.json({ 
        error: 'Quiz submission exceeded time limit of 30 minutes', 
        code: 'TIME_LIMIT_EXCEEDED' 
      }, { status: 400 });
    }

    // Check if team already submitted
    const existingSubmission = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.teamId, teamId))
      .limit(1);

    if (existingSubmission.length > 0) {
      return NextResponse.json({ 
        error: 'Team has already submitted quiz', 
        code: 'ALREADY_SUBMITTED' 
      }, { status: 409 });
    }

    // Validate team has exactly 5 members
    const memberCount = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    if (memberCount.length !== 5) {
      return NextResponse.json({ 
        error: 'Team must have exactly 5 members to submit quiz', 
        code: 'INVALID_TEAM_SIZE' 
      }, { status: 400 });
    }

    // Validate answers format and get options
    if (answers.length !== 15) {
      return NextResponse.json({ 
        error: 'Quiz must have exactly 15 answers', 
        code: 'INVALID_ANSWER_COUNT' 
      }, { status: 400 });
    }

    const questionIds = answers.map(a => a.questionId);
    const optionIds = answers.map(a => a.optionId);

    // Get all questions and options
    const questionsData = await db
      .select()
      .from(questions)
      .where(inArray(questions.id, questionIds));

    const optionsData = await db
      .select()
      .from(options)
      .where(inArray(options.id, optionIds));

    if (questionsData.length !== 15 || optionsData.length !== 15) {
      return NextResponse.json({ 
        error: 'Invalid questions or options in answers', 
        code: 'INVALID_QUESTIONS_OPTIONS' 
      }, { status: 400 });
    }

    // Calculate score and tokens
    let rawScore = 0;
    let tokensMarketing = 0;
    let tokensCapital = 0;
    let tokensTeam = 0;
    let tokensStrategy = 0;

    for (const answer of answers) {
      const option = optionsData.find(o => o.id === answer.optionId);
      if (option) {
        rawScore += option.totalScoreDelta;
        tokensMarketing += option.tokenDeltaMarketing;
        tokensCapital += option.tokenDeltaCapital;
        tokensTeam += option.tokenDeltaTeam;
        tokensStrategy += option.tokenDeltaStrategy;
      }
    }

    // Apply ceiling to raw score (max 60 points)
    const finalScore = Math.min(Math.ceil(rawScore), 60);

    // Create quiz submission
    const newSubmission = await db.insert(quizSubmissions).values([
      {
        teamId: teamId,
        memberCount: 5,
        answers: answers,
        rawScore: finalScore,
        tokensMarketing: tokensMarketing,
        tokensCapital: tokensCapital,
        tokensTeam: tokensTeam,
        tokensStrategy: tokensStrategy,
        durationSeconds: durationSeconds,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json({
      submission: newSubmission[0],
      calculatedScore: finalScore,
      tokens: {
        marketing: tokensMarketing,
        capital: tokensCapital,
        team: tokensTeam,
        strategy: tokensStrategy,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('POST quiz submit error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}