import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { options, userRoles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// POST handler - Create new option (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
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

    const { 
      questionId, 
      text, 
      order, 
      tokenDeltaMarketing = 0,
      tokenDeltaCapital = 0,
      tokenDeltaTeam = 0,
      tokenDeltaStrategy = 0,
      totalScoreDelta = 0
    } = await request.json();
    
    if (!questionId || !text || order === undefined) {
      return NextResponse.json({ 
        error: 'Question ID, text, and order are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate token constraints
    const tokenDeltas = [tokenDeltaMarketing, tokenDeltaCapital, tokenDeltaTeam, tokenDeltaStrategy];
    const maxPositiveToken = Math.max(...tokenDeltas);
    const minNegativeToken = Math.min(...tokenDeltas);

    if (maxPositiveToken > 4) {
      return NextResponse.json({ 
        error: 'Maximum positive token delta cannot exceed +4', 
        code: 'TOKEN_LIMIT_EXCEEDED' 
      }, { status: 400 });
    }

    if (maxPositiveToken > 0 && minNegativeToken >= 0) {
      return NextResponse.json({ 
        error: 'If any token delta is positive, there must be negative trade-offs', 
        code: 'MISSING_TRADEOFFS' 
      }, { status: 400 });
    }

    const newOption = await db.insert(options).values({
      questionId: questionId,
      text: text.trim(),
      order: order,
      tokenDeltaMarketing: tokenDeltaMarketing,
      tokenDeltaCapital: tokenDeltaCapital,
      tokenDeltaTeam: tokenDeltaTeam,
      tokenDeltaStrategy: tokenDeltaStrategy,
      totalScoreDelta: totalScoreDelta,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newOption[0], { status: 201 });
  } catch (error) {
    console.error('POST options error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}