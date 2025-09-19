import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { options } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler - Create new option (Admin only)
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

    // userRoles table removed. Add admin check if needed.

    const { 
      questionId, 
      text, 
      order, 
      tokenDeltaMarketing = 0,
      tokenDeltaCapital = 0,
      tokenDeltaTeam = 0,
      tokenDeltaStrategy = 0
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

    const newOption = await db.insert(options).values([
      {
        questionId: questionId,
        text: text.trim(),
        order: order,
        tokenDeltaMarketing: tokenDeltaMarketing,
        tokenDeltaCapital: tokenDeltaCapital,
        tokenDeltaTeam: tokenDeltaTeam,
        tokenDeltaStrategy: tokenDeltaStrategy,
        createdAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newOption[0], { status: 201 });
  } catch (error) {
    console.error('POST options error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}