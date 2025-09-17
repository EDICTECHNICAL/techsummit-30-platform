import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  // Find user by username
  const found = await db.select().from(user).where(eq(user.username, username));
  if (found.length === 0) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const valid = compareSync(password, found[0].password ?? '');
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  // TODO: Set session/cookie here if needed
  return NextResponse.json({ success: true, user: { id: found[0].id, username: found[0].username, name: found[0].name } });
}
