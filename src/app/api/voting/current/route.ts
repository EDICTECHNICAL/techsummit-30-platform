import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

// In-memory state for demo (replace with DB in production)
type VotingTeam = { id: string | number; name: string } | null;
let votingState: {
  team: VotingTeam;
  votingActive: boolean;
  allPitchesCompleted: boolean;
} = {
  team: null,
  votingActive: false,
  allPitchesCompleted: false,
};

// GET handler - Get current voting state (public endpoint)
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(votingState);
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
    // Admin authentication required
    const authUser = await requireAdmin(request);

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
    // Admin authentication required
    const authUser = await requireAdmin(request);

    const { votingActive, allPitchesCompleted } = await request.json();
    
    // Update voting state
    if (typeof votingActive === 'boolean') {
      votingState.votingActive = votingActive;
    }
    
    if (typeof allPitchesCompleted === 'boolean') {
      votingState.allPitchesCompleted = allPitchesCompleted;
    }
    
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