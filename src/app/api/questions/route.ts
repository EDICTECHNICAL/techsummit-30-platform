import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db/index';
import { questions, options } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// GET handler - List all questions with options
export async function GET(request: NextRequest) {
  try {
    const questionsWithOptions = await db
      .select({
        id: questions.id,
        text: questions.text,
        order: questions.order,
        maxTokenPerQuestion: questions.maxTokenPerQuestion,
        createdAt: questions.createdAt,
        optionId: options.id,
        optionText: options.text,
        optionOrder: options.order,
        tokenDeltaMarketing: options.tokenDeltaMarketing,
        tokenDeltaCapital: options.tokenDeltaCapital,
        tokenDeltaTeam: options.tokenDeltaTeam,
        tokenDeltaStrategy: options.tokenDeltaStrategy,
        totalScoreDelta: options.totalScoreDelta,
      })
      .from(questions)
      .leftJoin(options, eq(questions.id, options.questionId))
      .orderBy(questions.order, options.order);

    // Group by question and structure response
    const questionMap = new Map();
    
    for (const row of questionsWithOptions) {
      if (!questionMap.has(row.id)) {
        questionMap.set(row.id, {
          id: row.id,
          text: row.text,
          order: row.order,
          maxTokenPerQuestion: row.maxTokenPerQuestion,
          createdAt: row.createdAt,
          options: [],
        });
      }
      
      const question = questionMap.get(row.id);
      if (row.optionId) {
        question.options.push({
          id: row.optionId,
          text: row.optionText,
          order: row.optionOrder,
          tokenDeltaMarketing: row.tokenDeltaMarketing,
          tokenDeltaCapital: row.tokenDeltaCapital,
          tokenDeltaTeam: row.tokenDeltaTeam,
          tokenDeltaStrategy: row.tokenDeltaStrategy,
          totalScoreDelta: row.totalScoreDelta,
        });
      }
    }

    const result = Array.from(questionMap.values());
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET questions error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// POST handler - Create new question (Admin only)
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
        .from(questions) // Placeholder for admin check if needed
        // userRoles table removed. Add admin check if needed.

    if (isAdmin.length === 0) {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    const { text, order, maxTokenPerQuestion = 4 } = await request.json();
    
    if (!text || order === undefined) {
      return NextResponse.json({ 
        error: 'Text and order are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    if (maxTokenPerQuestion < 1 || maxTokenPerQuestion > 4) {
      return NextResponse.json({ 
        error: 'Max token per question must be between 1 and 4', 
        code: 'INVALID_MAX_TOKEN' 
      }, { status: 400 });
    }

    const newQuestion = await db.insert(questions).values([
      {
        text: text.trim(),
        order: order,
        maxTokenPerQuestion: maxTokenPerQuestion,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]).returning();

    return NextResponse.json(newQuestion[0], { status: 201 });
  } catch (error) {
    console.error('POST questions error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}