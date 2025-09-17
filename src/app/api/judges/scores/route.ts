import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { judgeScores, userRoles, rounds } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Submit judge score (Admin only during final round)
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

    const { judgeName, teamId, score } = await request.json();
    
    if (!judgeName || !teamId || score === undefined) {
      return NextResponse.json({ 
        error: 'Judge name, team ID, and score are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate score is integer
    if (!Number.isInteger(score)) {
      return NextResponse.json({ 
        error: 'Score must be an integer', 
        code: 'INVALID_SCORE' 
      }, { status: 400 });
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

    // Check if this judge already scored this team
    const existingScore = await db
      .select()
      .from(judgeScores)
      .where(and(
        eq(judgeScores.judgeName, judgeName.trim()),
        eq(judgeScores.teamId, teamId)
      ))
      .limit(1);

    if (existingScore.length > 0) {
      return NextResponse.json({ 
        error: 'This judge has already scored this team', 
        code: 'ALREADY_SCORED' 
      }, { status: 409 });
    }

    const newScore = await db.insert(judgeScores).values([
      {
        judgeName: judgeName.trim(),
        teamId: teamId,
        score: score,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newScore[0], { status: 201 });
  } catch (error) {
    console.error('POST judge score error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// GET handler - Get judge scores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const judgeName = searchParams.get('judgeName');

    let whereClauses = [];
    if (teamId) {
      whereClauses.push(eq(judgeScores.teamId, parseInt(teamId)));
    }
    if (judgeName) {
      whereClauses.push(eq(judgeScores.judgeName, judgeName));
    }
    const scores = await db
      .select()
      .from(judgeScores)
      .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
      .orderBy(judgeScores.createdAt);

    if (teamId) {
      // Calculate team statistics
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

      return NextResponse.json({
        teamId: parseInt(teamId),
        scores: scores,
        totalScore: totalScore,
        averageScore: Math.round(averageScore * 100) / 100,
        judgeCount: scores.length,
      });
    }

    return NextResponse.json(scores);
  } catch (error) {
    console.error('GET judge scores error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}