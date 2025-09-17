import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { username, password, name } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  // Check if username already exists
  const existing = await db.select().from(user).where(eq(user.username, username));
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  // Hash password
  const hashedPassword = hashSync(password, 10);

  // Insert new user
  await db.insert(user).values({
    id: crypto.randomUUID(),
    username,
    name: name || username,
    password: hashedPassword,
    image: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
