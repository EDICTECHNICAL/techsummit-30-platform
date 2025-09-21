import { NextRequest, NextResponse } from 'next/server';
import { ratingEmitter } from '@/lib/rating-emitter';
import {
  getRatingState,
  setTeam as setRatingTeam,
  startRatingCycle,
  startQnaPause,
  startRatingWarning,
  startRatingPhase,
  stopRatingCycle,
  setRatingActiveManually,
  setAllPitchesCompleted,
  ratingState as sharedRatingState,
} from '@/lib/rating-state';

// Helper function to check admin authentication (both JWT and cookie-based)
function checkAdminAuth(req: NextRequest): boolean {
  // Check cookie-based admin auth first
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-auth=true")) {
    return true;
  }
  return false;
}

// Use centralized rating-state module (sharedRatingState for direct reference when needed)

// GET handler - Get current rating state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Return centralized rating state (read-only)
    const currentState = getRatingState();
    console.log('GET /api/rating/current - returning centralized state:', currentState);
    return NextResponse.json(currentState);
  } catch (error) {
    console.error('GET rating current error:', error);
    return NextResponse.json({ 
      error: 'Failed to get rating state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler - Set current pitching team or start rating cycle (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        const { requireAdmin } = await import('@/lib/auth-middleware');
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const requestBody = await request.json();
    
    // Handle rating cycle actions via centralized module
    if (requestBody.action) {
      switch (requestBody.action) {
        case 'start':
          startRatingCycle();
          return NextResponse.json({ success: true, ratingState: getRatingState(), message: 'Rating cycle started successfully' });
        case 'start-qna':
          startQnaPause();
          return NextResponse.json({ success: true, ratingState: getRatingState(), message: 'Q&A session started successfully' });
        case 'start-rating':
          // start with warning phase
          startRatingWarning();
          return NextResponse.json({ success: true, ratingState: getRatingState(), message: 'Rating warning started - 5 seconds until rating begins' });
        case 'stop':
          stopRatingCycle();
          return NextResponse.json({ success: true, ratingState: getRatingState(), message: 'Rating cycle stopped successfully' });
        default:
          return NextResponse.json({ error: 'Invalid action. Supported actions: start, start-qna, start-rating, stop' }, { status: 400 });
      }
    }
    
    // Handle setting current team (legacy functionality)
    const { teamId, teamName } = requestBody;
    let name = teamName;
    
    // Try to get real team name from DB if not provided
    if (!name && teamId) {
      try {
        const { db } = await import('@/db');
        const { teams } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
        if (team.length > 0 && team[0].name) {
          name = team[0].name;
        }
      } catch (dbError) {
        console.error('Error fetching team name:', dbError);
      }
    }
    
    // Set the team using centralized state
    setRatingTeam(teamId && name ? { id: teamId, name } : null);
    // Emit explicit teamChanged event for compatibility
    ratingEmitter.broadcast({ type: 'teamChanged', data: getRatingState() });
    return NextResponse.json({ success: true, ratingState: getRatingState(), message: getRatingState().team ? `Set current team to ${name}` : 'Cleared current team' });

  } catch (error: any) {
    console.error('POST rating current error:', error);
    
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
      error: 'Failed to set rating state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH handler - Update rating state (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication (cookie-based or JWT-based)
    const hasAdminAuth = checkAdminAuth(request);
    if (!hasAdminAuth) {
      // Fall back to JWT-based authentication
      try {
        const { requireAdmin } = await import('@/lib/auth-middleware');
        await requireAdmin(request);
      } catch (error) {
        return NextResponse.json({ 
          error: 'Admin access required', 
          code: 'ADMIN_REQUIRED' 
        }, { status: 403 });
      }
    }

    const { ratingActive, allPitchesCompleted, ratingCycleActive, currentPhase, phaseTimeLeft, cycleStartTime, phaseStartTime } = await request.json();
    
    // Update rating state (mutate centralized sharedRatingState)
    if (typeof ratingActive === 'boolean') {
      sharedRatingState.ratingActive = ratingActive;
    }

    if (typeof allPitchesCompleted === 'boolean') {
      sharedRatingState.allPitchesCompleted = allPitchesCompleted;
    }

    // Update rating cycle state
    if (typeof ratingCycleActive === 'boolean') {
      sharedRatingState.ratingCycleActive = ratingCycleActive;
    }

    if (currentPhase && ['idle', 'pitching', 'qna-pause', 'rating-warning', 'rating-active'].includes(currentPhase)) {
      sharedRatingState.currentPhase = currentPhase as any;
    }

    if (typeof phaseTimeLeft === 'number') {
      sharedRatingState.phaseTimeLeft = phaseTimeLeft;
    }

    if (typeof cycleStartTime === 'number' || cycleStartTime === null) {
      sharedRatingState.cycleStartTime = cycleStartTime as any;
    }

    if (typeof phaseStartTime === 'number' || phaseStartTime === null) {
      sharedRatingState.phaseStartTime = phaseStartTime as any;
    }

    // Broadcast the rating state change via SSE
    ratingEmitter.broadcast({
      type: 'ratingStateChanged',
      data: sharedRatingState
    });

    return NextResponse.json({
      success: true,
      ratingState: sharedRatingState,
      message: 'Rating state updated successfully'
    });

  } catch (error: any) {
    console.error('PATCH rating current error:', error);
    
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
      error: 'Failed to update rating state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}