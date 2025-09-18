import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rounds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, authenticateRequest } from '@/lib/auth-middleware';

// GET handler - List all rounds (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const allRounds = await db
      .select()
      .from(rounds)
      .orderBy(rounds.day, rounds.id);

    // Add computed fields
    const enrichedRounds = allRounds.map(round => {
      const now = new Date();
      const isActive = round.status === 'ACTIVE';
      const isPending = round.status === 'PENDING';
      const isCompleted = round.status === 'COMPLETED';

      let canStart = false;
      let canEnd = false;

      let startTime: Date | null = null;
      let endTime: Date | null = null;
      if (round.startsAt) {
        startTime = new Date(round.startsAt);
        if (isNaN(startTime.getTime())) startTime = null;
      }
      if (round.endsAt) {
        endTime = new Date(round.endsAt);
        if (isNaN(endTime.getTime())) endTime = null;
      }

      if (startTime && endTime) {
        canStart = isPending && now >= startTime;
        canEnd = isActive && now >= endTime;
      }

      return {
        ...round,
        isActive,
        isPending,
        isCompleted,
        canStart,
        canEnd,
        timeUntilStart: startTime ? Math.max(0, startTime.getTime() - now.getTime()) : null,
        timeUntilEnd: endTime ? Math.max(0, endTime.getTime() - now.getTime()) : null,
      };
    });

    return NextResponse.json(enrichedRounds);

  } catch (error) {
    console.error('GET rounds error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch rounds',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// PATCH handler - Update round status (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAdmin(request);

    const { roundId, status, startsAt, endsAt } = await request.json();
    
    if (!roundId) {
      return NextResponse.json({ 
        error: 'Round ID is required', 
        code: 'MISSING_ROUND_ID' 
      }, { status: 400 });
    }

    // Validate roundId is a number
    const numericRoundId = Number(roundId);
    if (!Number.isInteger(numericRoundId) || numericRoundId < 1) {
      return NextResponse.json({ 
        error: 'Round ID must be a valid positive integer', 
        code: 'INVALID_ROUND_ID' 
      }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be PENDING, ACTIVE, or COMPLETED', 
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Check if round exists
    const existingRound = await db
      .select()
      .from(rounds)
      .where(eq(rounds.id, numericRoundId))
      .limit(1);

    if (existingRound.length === 0) {
      return NextResponse.json({ 
        error: 'Round not found', 
        code: 'ROUND_NOT_FOUND' 
      }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      
      // Auto-set timestamps based on status
      if (status === 'ACTIVE' && !existingRound[0].startsAt) {
        updateData.startsAt = new Date();
      }
      if (status === 'COMPLETED' && !existingRound[0].endsAt) {
        updateData.endsAt = new Date();
      }
    }

    if (startsAt) {
      const startDate = new Date(startsAt);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date format', 
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
      updateData.startsAt = startDate;
    }

    if (endsAt) {
      const endDate = new Date(endsAt);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid end date format', 
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
      updateData.endsAt = endDate;
    }

    // Validate start/end date logic
    if (updateData.startsAt && updateData.endsAt && updateData.startsAt.getTime() >= updateData.endsAt.getTime()) {
      return NextResponse.json({ 
        error: 'Start date must be before end date', 
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    // Special validation for quiz round
    if (existingRound[0].name === 'QUIZ' && status === 'ACTIVE') {
      // Check if there are questions available
      const { questions } = await import('@/db/schema');
      const questionCountArr = await db.select({ count: db.$count(questions.id) }).from(questions);
      const questionCount = questionCountArr[0]?.count ?? 0;
      if (questionCount < 15) {
        return NextResponse.json({ 
          error: 'Cannot activate quiz round: Need at least 15 questions', 
          code: 'INSUFFICIENT_QUESTIONS' 
        }, { status: 400 });
      }
    }

    const updatedRound = await db
      .update(rounds)
      .set(updateData)
      .where(eq(rounds.id, numericRoundId))
      .returning();

    return NextResponse.json({
      ...updatedRound[0],
      message: `Round ${existingRound[0].name} successfully updated`
    });

  } catch (error: any) {
    console.error('PATCH rounds error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to update round',
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

// POST handler - Create new round (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAdmin(request);

    const { name, day, description, startsAt, endsAt } = await request.json();
    
    if (!name || !day) {
      return NextResponse.json({ 
        error: 'Name and day are required', 
        code: 'MISSING_REQUIRED_FIELDS' 
      }, { status: 400 });
    }

    // Validate name
    const validNames = ['QUIZ', 'VOTING', 'FINAL'];
    if (!validNames.includes(name.toUpperCase())) {
      return NextResponse.json({ 
        error: 'Invalid round name. Must be QUIZ, VOTING, or FINAL', 
        code: 'INVALID_ROUND_NAME' 
      }, { status: 400 });
    }

    // Validate day
    if (!Number.isInteger(day) || day < 1) {
      return NextResponse.json({ 
        error: 'Day must be a positive integer', 
        code: 'INVALID_DAY' 
      }, { status: 400 });
    }

    // Check if round already exists
    const existingRound = await db
      .select()
      .from(rounds)
      .where(eq(rounds.name, name.toUpperCase()))
      .limit(1);

    if (existingRound.length > 0) {
      return NextResponse.json({ 
        error: 'Round with this name already exists', 
        code: 'DUPLICATE_ROUND' 
      }, { status: 409 });
    }

    // Validate dates if provided
    let startDate = null;
    let endDate = null;
    
    if (startsAt) {
      startDate = new Date(startsAt);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid start date format', 
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
    }

    if (endsAt) {
      endDate = new Date(endsAt);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid end date format', 
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
    }

    if (startDate && endDate && startDate.getTime() >= endDate.getTime()) {
      return NextResponse.json({ 
        error: 'Start date must be before end date', 
        code: 'INVALID_DATE_RANGE' 
      }, { status: 400 });
    }

    const newRound = await db.insert(rounds).values({
      name: name.toUpperCase(),
      day: day,
      status: 'PENDING',
      startsAt: startDate,
      endsAt: endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newRound[0], { status: 201 });

  } catch (error: any) {
    console.error('POST rounds error:', error);
    
    // Handle authentication errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        error: 'Authentication required', 
        code: 'UNAUTHENTICATED' 
      }, { status: 401 });
    }
    
    if (error.message === 'Admin access required') {
      return NextResponse.json({ 
        error: 'Admin access required', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      error: 'Failed to create round',
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}