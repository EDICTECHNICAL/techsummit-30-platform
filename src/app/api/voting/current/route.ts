import { NextRequest, NextResponse } from 'next/server';
import { votingEmitter } from '@/lib/voting-emitter';

// Helper function to check admin authentication (both JWT and cookie-based)
function checkAdminAuth(req: NextRequest): boolean {
  // Check cookie-based admin auth first
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin-auth=true")) {
    return true;
  }
  return false;
}

// In-memory state for demo (replace with DB in production)
type VotingTeam = { id: string | number; name: string } | null;
let votingState: {
  team: VotingTeam;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  // Pitch cycle state
  pitchCycleActive: boolean;
  currentPhase: 'idle' | 'pitching' | 'preparing' | 'voting';
  phaseTimeLeft: number;
  cycleStartTime: number | null;
} = {
  team: null,
  votingActive: false,
  allPitchesCompleted: false,
  pitchCycleActive: false,
  currentPhase: 'idle',
  phaseTimeLeft: 0,
  cycleStartTime: null,
};

// Auto-timeout functionality
let votingTimeout: NodeJS.Timeout | null = null;

const autoDisableVoting = () => {
  if (votingTimeout) {
    clearTimeout(votingTimeout);
  }
  
  votingTimeout = setTimeout(() => {
    if (votingState.votingActive) {
      votingState.votingActive = false;
      console.log('Auto-disabled voting after 30 seconds timeout');
    }
    votingTimeout = null;
  }, 30000); // 30 seconds
};

// GET handler - Get current voting state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Calculate real-time phase time left if in pitch cycle
    let currentState = { ...votingState };
    
    if (currentState.pitchCycleActive && currentState.cycleStartTime) {
      const elapsed = Math.floor((Date.now() - currentState.cycleStartTime) / 1000);
      
      if (elapsed < 90) {
        // Pitching phase (90 seconds)
        currentState.currentPhase = 'pitching';
        currentState.phaseTimeLeft = Math.max(0, 90 - elapsed);
      } else if (elapsed < 95) {
        // Preparation phase (5 seconds)
        currentState.currentPhase = 'preparing';
        currentState.phaseTimeLeft = Math.max(0, 95 - elapsed);
      } else if (elapsed < 125) {
        // Voting phase (30 seconds)
        currentState.currentPhase = 'voting';
        currentState.phaseTimeLeft = Math.max(0, 125 - elapsed);
        // Auto-enable voting during voting phase
        if (!currentState.votingActive) {
          currentState.votingActive = true;
          votingState.votingActive = true;
        }
      } else {
        // Cycle should be completed
        currentState.pitchCycleActive = false;
        currentState.currentPhase = 'idle';
        currentState.phaseTimeLeft = 0;
        currentState.votingActive = false;
        currentState.cycleStartTime = null;
        
        // Update the actual state
        votingState.pitchCycleActive = false;
        votingState.currentPhase = 'idle';
        votingState.phaseTimeLeft = 0;
        votingState.votingActive = false;
        votingState.cycleStartTime = null;
        
        console.log('Auto-completed pitch cycle after timeout');
      }
    }
    
    console.log('GET /api/voting/current - returning state:', currentState);
    return NextResponse.json(currentState);
  } catch (error) {
    console.error('GET voting current error:', error);
    return NextResponse.json({ 
      error: 'Failed to get voting state',
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
    
    // Set the team and reset voting state
    votingState.team = teamId && name ? { id: teamId, name } : null;
    votingState.votingActive = false; // Reset voting when team changes
    
    // Broadcast the change via SSE
    votingEmitter.broadcast({
      type: 'teamChanged',
      data: votingState
    });
    
    return NextResponse.json({
      success: true,
      votingState,
      message: votingState.team ? `Set current team to ${name}` : 'Cleared current team'
    });

  } catch (error: any) {
    console.error('POST voting current error:', error);
    
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
      error: 'Failed to set voting state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH handler - Update voting state (Admin only)
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

    const { votingActive, allPitchesCompleted, pitchCycleActive, currentPhase, phaseTimeLeft, cycleStartTime } = await request.json();
    
    // Update voting state
    if (typeof votingActive === 'boolean') {
      votingState.votingActive = votingActive;
      
      // Start auto-timeout when voting is activated (only if not part of pitch cycle)
      if (votingActive && !votingState.pitchCycleActive) {
        autoDisableVoting();
        console.log('Voting activated - auto-timeout set for 30 seconds');
      } else {
        // Clear timeout if voting is manually disabled
        if (votingTimeout) {
          clearTimeout(votingTimeout);
          votingTimeout = null;
          console.log('Voting manually disabled - auto-timeout cleared');
        }
      }
    }
    
    if (typeof allPitchesCompleted === 'boolean') {
      votingState.allPitchesCompleted = allPitchesCompleted;
    }

    // Update pitch cycle state
    if (typeof pitchCycleActive === 'boolean') {
      votingState.pitchCycleActive = pitchCycleActive;
    }
    
    if (currentPhase && ['idle', 'pitching', 'preparing', 'voting'].includes(currentPhase)) {
      votingState.currentPhase = currentPhase;
    }
    
    if (typeof phaseTimeLeft === 'number') {
      votingState.phaseTimeLeft = phaseTimeLeft;
    }
    
    if (typeof cycleStartTime === 'number' || cycleStartTime === null) {
      votingState.cycleStartTime = cycleStartTime;
    }
    
    // Broadcast the voting state change via SSE
    votingEmitter.broadcast({
      type: 'votingStateChanged',
      data: votingState
    });
    
    return NextResponse.json({
      success: true,
      votingState,
      message: 'Voting state updated successfully'
    });

  } catch (error: any) {
    console.error('PATCH voting current error:', error);
    
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
      error: 'Failed to update voting state',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}