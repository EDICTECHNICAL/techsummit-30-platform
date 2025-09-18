import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';

// GET handler - List all users for debugging
export async function GET(request: NextRequest) {
  try {
    const users = await db
      .select({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin,
      })
      .from(user);

    return NextResponse.json({
      users,
      message: 'Use these user IDs to set up team mappings in /api/dev/user-team'
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}