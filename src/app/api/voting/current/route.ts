import { NextRequest, NextResponse } from 'next/server';
import { votingEmitter } from '@/lib/voting-emitter';
import {
  getVotingState,
  setTeam,
  startPitchCycle,
  startPrep,
  startVotingPhase,
  stopPitchCycle,
  setVotingActiveManually,
  setAllPitchesCompleted,
} from '@/lib/voting-state';

// Helper function to check admin authentication (JWT-based only)
function checkAdminAuth(req: NextRequest): boolean {
  try {
    const { requireAdmin } = require('@/lib/auth-middleware');
    // This will throw if not authenticated
    requireAdmin(req);
    return true;
  } catch (error) {
    return false;
  }
}

// Centralized voting state and ticker live in `src/lib/voting-state.ts`.
// Use `getVotingState()` to read authoritative state and the exported helpers
// (`setTeam`, `startPitchCycle`, `startPrep`, `startVotingPhase`, `stopPitchCycle`,
// `setVotingActiveManually`) to mutate state so all changes are consistently
// timestamped and broadcast via SSE.

// GET handler - Get current voting state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Return authoritative state from the centralized ticker (shallow copy)
    const current = getVotingState();
    const derived = { ...current };
    console.log('GET /api/voting/current - returning authoritative state');
    return NextResponse.json(derived);
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

    const requestBody = await request.json();
    const { teamId, teamName } = requestBody;
    const action = requestBody.action as string | undefined;
    let name = teamName;

    // If admin wants to control the pitch cycle via actions, use the centralized helpers
    if (action) {
      switch (action) {
        case 'start-cycle':
          startPitchCycle();
          return NextResponse.json({ success: true, votingState: getVotingState(), message: 'Pitch cycle started' });

        case 'start-prep': {
          const s = getVotingState();
          if (!s.pitchCycleActive) {
            return NextResponse.json({ error: 'No active pitch cycle', status: 400 }, { status: 400 });
          }
          startPrep();
          return NextResponse.json({ success: true, votingState: getVotingState(), message: 'Preparation started' });
        }

        case 'start-voting': {
          const s = getVotingState();
          if (!s.pitchCycleActive) {
            return NextResponse.json({ error: 'No active pitch cycle', status: 400 }, { status: 400 });
          }
          startVotingPhase();
          return NextResponse.json({ success: true, votingState: getVotingState(), message: 'Voting started' });
        }

        case 'stop-cycle':
          stopPitchCycle();
          return NextResponse.json({ success: true, votingState: getVotingState(), message: 'Pitch cycle stopped' });

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }
    
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
    
  // Set the team and reset voting state via central helper
  setTeam(teamId && name ? { id: teamId, name } : null);

  return NextResponse.json({
    success: true,
    votingState: getVotingState(),
    message: getVotingState().team ? `Set current team to ${name}` : 'Cleared current team'
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

    // Update votingActive via central helper so auto-timeouts are handled there
    if (typeof votingActive === 'boolean') {
      setVotingActiveManually(votingActive);
    }

    // allPitchesCompleted setter
    if (typeof allPitchesCompleted === 'boolean') {
      setAllPitchesCompleted(allPitchesCompleted);
    }

    // Update pitch cycle state via helpers
    if (typeof pitchCycleActive === 'boolean') {
      if (pitchCycleActive) startPitchCycle(); else stopPitchCycle();
    }

    // Allow admin to set currentPhase manually via helpers (startPrep/startVotingPhase)
    if (currentPhase && ['idle', 'pitching', 'preparing', 'voting'].includes(currentPhase)) {
      switch (currentPhase) {
        case 'pitching':
          startPitchCycle();
          break;
        case 'preparing':
          startPrep();
          break;
        case 'voting':
          startVotingPhase();
          break;
        case 'idle':
          stopPitchCycle();
          break;
      }
    }

    // phaseTimeLeft and cycleStartTime are derived values from the centralized ticker - ignore direct overrides.

    // Return authoritative state
    return NextResponse.json({
      success: true,
      votingState: getVotingState(),
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