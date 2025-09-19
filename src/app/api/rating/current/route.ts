import { NextRequest, NextResponse } from 'next/server';
import { ratingEmitter } from '../../sse/rating/route';

// Helper function to check admin authentication (both JWT and cookie-based)
function checkAdminAuth(req: NextRequest): boolean {
  // Check cookie-based admin auth first
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-auth=true")) {
    return true;
  }
  return false;
}

// In-memory state for rating cycle
type RatingTeam = { id: string | number; name: string } | null;
let ratingState: {
  team: RatingTeam;
  ratingActive: boolean;
  allPitchesCompleted: boolean;
  // Rating cycle state
  ratingCycleActive: boolean;
  currentPhase: 'idle' | 'pitching' | 'judges-rating' | 'peers-rating';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
} = {
  team: null,
  ratingActive: false,
  allPitchesCompleted: false,
  ratingCycleActive: false,
  currentPhase: 'idle',
  phaseTimeLeft: 0,
  cycleStartTime: null,
};

// GET handler - Get current rating state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Calculate real-time phase time left if in rating cycle
    let currentState = { ...ratingState };
    
    if (currentState.ratingCycleActive && currentState.cycleStartTime) {
      const elapsed = Math.floor((Date.now() - currentState.cycleStartTime) / 1000);
      
      if (elapsed < 300) {
        // Pitching phase (5 minutes = 300 seconds)
        currentState.currentPhase = 'pitching';
        currentState.phaseTimeLeft = Math.max(0, 300 - elapsed);
      } else if (elapsed < 360) {
        // Judges rating phase (1 minute = 60 seconds)
        currentState.currentPhase = 'judges-rating';
        currentState.phaseTimeLeft = Math.max(0, 360 - elapsed);
        // Auto-enable rating during judges rating phase
        if (!currentState.ratingActive) {
          currentState.ratingActive = true;
          ratingState.ratingActive = true;
        }
      } else if (elapsed < 420) {
        // Peers rating phase (1 minute = 60 seconds)
        currentState.currentPhase = 'peers-rating';
        currentState.phaseTimeLeft = Math.max(0, 420 - elapsed);
        // Keep rating active for peers
        if (!currentState.ratingActive) {
          currentState.ratingActive = true;
          ratingState.ratingActive = true;
        }
      } else {
        // Cycle should be completed
        currentState.ratingCycleActive = false;
        currentState.currentPhase = 'idle';
        currentState.phaseTimeLeft = 0;
        currentState.ratingActive = false;
        currentState.cycleStartTime = null;
        
        // Update the actual state
        ratingState.ratingCycleActive = false;
        ratingState.currentPhase = 'idle';
        ratingState.phaseTimeLeft = 0;
        ratingState.ratingActive = false;
        ratingState.cycleStartTime = null;
        
        console.log('Auto-completed rating cycle after timeout');
      }
    }
    
    console.log('GET /api/rating/current - returning state:', currentState);
    return NextResponse.json(currentState);
  } catch (error) {
    console.error('GET rating current error:', error);
    return NextResponse.json({ 
      error: 'Failed to get rating state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler - Set current pitching team (Admin only)
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

    const { teamId, teamName } = await request.json();
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
    
    // Set the team and reset rating state
    ratingState.team = teamId && name ? { id: teamId, name } : null;
    ratingState.ratingActive = false; // Reset rating when team changes
    
    // Broadcast the change via SSE
    ratingEmitter.broadcast({
      type: 'teamChanged',
      data: ratingState
    });
    
    return NextResponse.json({
      success: true,
      ratingState,
      message: ratingState.team ? `Set current team to ${name}` : 'Cleared current team'
    });

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

    const { ratingActive, allPitchesCompleted, ratingCycleActive, currentPhase, phaseTimeLeft, cycleStartTime } = await request.json();
    
    // Update rating state
    if (typeof ratingActive === 'boolean') {
      ratingState.ratingActive = ratingActive;
    }
    
    if (typeof allPitchesCompleted === 'boolean') {
      ratingState.allPitchesCompleted = allPitchesCompleted;
    }

    // Update rating cycle state
    if (typeof ratingCycleActive === 'boolean') {
      ratingState.ratingCycleActive = ratingCycleActive;
    }
    
    if (currentPhase && ['idle', 'pitching', 'judges-rating', 'peers-rating'].includes(currentPhase)) {
      ratingState.currentPhase = currentPhase;
    }
    
    if (typeof phaseTimeLeft === 'number') {
      ratingState.phaseTimeLeft = phaseTimeLeft;
    }
    
    if (typeof cycleStartTime === 'number' || cycleStartTime === null) {
      ratingState.cycleStartTime = cycleStartTime;
    }
    
    // Broadcast the rating state change via SSE
    ratingEmitter.broadcast({
      type: 'ratingStateChanged',
      data: ratingState
    });
    
    return NextResponse.json({
      success: true,
      ratingState,
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