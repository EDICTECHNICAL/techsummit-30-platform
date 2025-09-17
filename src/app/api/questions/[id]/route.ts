import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions, userRoles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// PATCH handler - Update question (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const questionId = parseInt(params.id);
    if (!questionId || isNaN(questionId)) {
      return NextResponse.json({ 
        error: 'Valid question ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
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

    const updates = await request.json();
    const allowedFields = ['text', 'order', 'maxTokenPerQuestion'];
    const filteredUpdates = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'text') {
          filteredUpdates[key] = value.trim();
        } else if (key === 'maxTokenPerQuestion') {
          if (value < 1 || value > 4) {
            return NextResponse.json({ 
              error: 'Max token per question must be between 1 and 4', 
              code: 'INVALID_MAX_TOKEN' 
            }, { status: 400 });
          }
          filteredUpdates[key] = value;
        } else {
          filteredUpdates[key] = value;
        }
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update', 
        code: 'NO_VALID_FIELDS' 
      }, { status: 400 });
    }

    const updatedQuestion = await db
      .update(questions)
      .set({
        ...filteredUpdates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(questions.id, questionId))
      .returning();

    if (updatedQuestion.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json(updatedQuestion[0]);
  } catch (error) {
    console.error('PATCH question error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}

// DELETE handler - Delete question (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }

    const questionId = parseInt(params.id);
    if (!questionId || isNaN(questionId)) {
      return NextResponse.json({ 
        error: 'Valid question ID is required', 
        code: 'INVALID_ID' 
      }, { status: 400 });
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

    // Delete question (cascade will handle options)
    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, questionId))
      .returning();

    if (deletedQuestion.length === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Question successfully deleted', 
      question: deletedQuestion[0] 
    });
  } catch (error) {
    console.error('DELETE question error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}