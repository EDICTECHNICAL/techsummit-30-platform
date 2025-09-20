import { NextRequest, NextResponse } from 'next/server';
import { ratingEmitter } from '@/lib/rating-emitter';

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
  currentPhase: 'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
  // Additional timing tracking
  phaseStartTime: number | null;
} = {
  team: null,
  ratingActive: false,
  allPitchesCompleted: false,
  ratingCycleActive: false,
  currentPhase: 'idle',
  phaseTimeLeft: 0,
  cycleStartTime: null,
  phaseStartTime: null,
};

// GET handler - Get current rating state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Calculate real-time phase time left if in rating cycle
    let currentState = { ...ratingState };
    
    if (currentState.ratingCycleActive && currentState.phaseStartTime) {
      if (currentState.currentPhase === 'pitching') {
        // Phase 1: Pitching (5 minutes = 300 seconds) - use phase-specific timing
        const pitchingElapsed = Math.floor((Date.now() - currentState.phaseStartTime) / 1000);
        console.log('Pitching phase - elapsed:', pitchingElapsed, 'seconds, started at:', new Date(currentState.phaseStartTime).toISOString());
        
        if (pitchingElapsed < 300) {
          currentState.phaseTimeLeft = Math.max(0, 300 - pitchingElapsed);
          currentState.ratingActive = false;
        } else {
          // Auto-transition to Q&A pause only if still in pitching phase
          console.log('Pitching phase complete (', pitchingElapsed, 'seconds elapsed), transitioning to Q&A pause');
          currentState.currentPhase = 'qna-pause';
          currentState.phaseTimeLeft = 0;
          currentState.ratingActive = false;
          currentState.phaseStartTime = Date.now();
          
          // Update the actual state
          ratingState.currentPhase = 'qna-pause';
          ratingState.phaseTimeLeft = 0;
          ratingState.phaseStartTime = Date.now();
          
          console.log('Auto-transitioned to Q&A pause after', pitchingElapsed, 'seconds of pitching');
        }
      } else if (currentState.currentPhase === 'qna-pause') {
        // Phase 2: Q&A Pause (admin controlled, no time limit)
        currentState.phaseTimeLeft = 0;
        currentState.ratingActive = false;
        console.log('Q&A pause phase - waiting for admin to start rating');
      } else if (currentState.currentPhase === 'rating-warning') {
        // Phase 3: Rating Warning (5 seconds)
        const warningElapsed = Math.floor((Date.now() - currentState.phaseStartTime) / 1000);
        console.log('Rating warning phase - elapsed:', warningElapsed, 'seconds, started at:', new Date(currentState.phaseStartTime).toISOString());
        
        if (warningElapsed < 5) {
          currentState.phaseTimeLeft = Math.max(0, 5 - warningElapsed);
          currentState.ratingActive = false;
          console.log('Still in warning phase, time left:', currentState.phaseTimeLeft);
        } else {
          // Auto-transition to rating after 5 seconds
          console.log('Warning phase complete (', warningElapsed, 'seconds elapsed), transitioning to rating-active');
          currentState.currentPhase = 'rating-active';
          currentState.phaseTimeLeft = 120; // 2 minutes
          currentState.ratingActive = true;
          currentState.phaseStartTime = Date.now();
          
          // Update actual state
          ratingState.currentPhase = 'rating-active';
          ratingState.phaseTimeLeft = 120;
          ratingState.ratingActive = true;
          ratingState.phaseStartTime = Date.now();
          
          console.log('Auto-transitioned to rating-active after', warningElapsed, 'second warning');
        }
      } else if (currentState.currentPhase === 'rating-active') {
        // Phase 4: Rating Active (2 minutes = 120 seconds) - use phase-specific timing
        const ratingElapsed = Math.floor((Date.now() - currentState.phaseStartTime) / 1000);
        console.log('Rating active phase - elapsed:', ratingElapsed, 'seconds, started at:', new Date(currentState.phaseStartTime).toISOString());
        
        if (ratingElapsed < 120) {
          currentState.phaseTimeLeft = Math.max(0, 120 - ratingElapsed);
          currentState.ratingActive = true;
        } else {
          // Auto-complete after 2 minutes
          console.log('Rating phase complete (', ratingElapsed, 'seconds elapsed), ending cycle');
          currentState.ratingCycleActive = false;
          currentState.currentPhase = 'idle';
          currentState.phaseTimeLeft = 0;
          currentState.ratingActive = false;
          currentState.cycleStartTime = null;
          currentState.phaseStartTime = null;
          
          // Update the actual state
          ratingState.ratingCycleActive = false;
          ratingState.currentPhase = 'idle';
          ratingState.phaseTimeLeft = 0;
          ratingState.ratingActive = false;
          ratingState.cycleStartTime = null;
          ratingState.phaseStartTime = null;
          
          console.log('Auto-completed rating cycle after', ratingElapsed, 'seconds of rating');
        }
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
    
    // Handle rating cycle actions
    if (requestBody.action) {
      switch (requestBody.action) {
        case 'start':
          // Start rating cycle
          ratingState.ratingCycleActive = true;
          ratingState.currentPhase = 'pitching';
          ratingState.cycleStartTime = Date.now();
          ratingState.phaseStartTime = Date.now(); // Track current phase start
          ratingState.phaseTimeLeft = 300; // 5 minutes
          ratingState.ratingActive = false; // Will be enabled during rating phase
          
          console.log('Started rating cycle:', ratingState);
          
          // Broadcast the change via SSE
          ratingEmitter.broadcast({
            type: 'ratingStateChanged',
            data: ratingState
          });
          
          return NextResponse.json({
            success: true,
            ratingState,
            message: 'Rating cycle started successfully'
          });

        case 'start-qna':
          // Transition from pitching to Q&A pause (manual override)
          if (ratingState.ratingCycleActive) {
            ratingState.currentPhase = 'qna-pause';
            ratingState.phaseStartTime = Date.now();
            ratingState.phaseTimeLeft = 0;
            ratingState.ratingActive = false;
            
            console.log('Manually started Q&A pause (overriding any previous phase):', ratingState);
            
            // Broadcast the change via SSE
            ratingEmitter.broadcast({
              type: 'ratingStateChanged',
              data: ratingState
            });
            
            return NextResponse.json({
              success: true,
              ratingState,
              message: 'Q&A session started successfully'
            });
          } else {
            return NextResponse.json({
              error: 'No active rating cycle to start Q&A'
            }, { status: 400 });
          }

        case 'start-rating':
          // Transition from Q&A pause to rating (with 5 sec warning first)
          if (ratingState.ratingCycleActive && ratingState.currentPhase === 'qna-pause') {
            ratingState.currentPhase = 'rating-warning';
            ratingState.phaseStartTime = Date.now();
            ratingState.phaseTimeLeft = 5;
            ratingState.ratingActive = false;
            
            console.log('Starting rating warning at:', new Date(ratingState.phaseStartTime).toISOString(), ratingState);
            
            // Broadcast the change via SSE
            ratingEmitter.broadcast({
              type: 'ratingStateChanged',
              data: ratingState
            });
            
            return NextResponse.json({
              success: true,
              ratingState,
              message: 'Rating warning started - 5 seconds until rating begins'
            });
          } else {
            return NextResponse.json({
              error: 'Can only start rating from Q&A pause phase'
            }, { status: 400 });
          }
          
        case 'stop':
          // Stop rating cycle
          ratingState.ratingCycleActive = false;
          ratingState.currentPhase = 'idle';
          ratingState.cycleStartTime = null;
          ratingState.phaseStartTime = null;
          ratingState.phaseTimeLeft = 0;
          ratingState.ratingActive = false;
          
          console.log('Stopped rating cycle:', ratingState);
          
          // Broadcast the change via SSE
          ratingEmitter.broadcast({
            type: 'ratingStateChanged',
            data: ratingState
          });
          
          return NextResponse.json({
            success: true,
            ratingState,
            message: 'Rating cycle stopped successfully'
          });
          
        default:
          return NextResponse.json({
            error: 'Invalid action. Supported actions: start, start-qna, start-rating, stop'
          }, { status: 400 });
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

    const { ratingActive, allPitchesCompleted, ratingCycleActive, currentPhase, phaseTimeLeft, cycleStartTime, phaseStartTime } = await request.json();
    
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
    
    if (currentPhase && ['idle', 'pitching', 'qna-pause', 'rating-warning', 'rating-active'].includes(currentPhase)) {
      ratingState.currentPhase = currentPhase;
    }
    
    if (typeof phaseTimeLeft === 'number') {
      ratingState.phaseTimeLeft = phaseTimeLeft;
    }
    
    if (typeof cycleStartTime === 'number' || cycleStartTime === null) {
      ratingState.cycleStartTime = cycleStartTime;
    }
    
    if (typeof phaseStartTime === 'number' || phaseStartTime === null) {
      ratingState.phaseStartTime = phaseStartTime;
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