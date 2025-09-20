import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { db } from '@/db/index';
import { admins } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  
  console.log('Login attempt - Username:', username);
  console.log('Login attempt - Password:', password);
  console.log('Login attempt - Password length:', password?.length);
  
  // Find admin by username
  const admin = await db.select().from(admins).where(sql`username = ${username}`).limit(1);
  console.log('Admin query result:', admin);
  
  if (!admin.length) {
    console.log('No admin found for username:', username);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  console.log('Stored hash:', admin[0].password);
  console.log('Comparing password:', password);
  console.log('Against hash:', admin[0].password);
  
  const valid = await bcrypt.compare(password, admin[0].password);
  console.log('Password valid:', valid);
  
  if (!valid) {
    console.log('Password mismatch for username:', username);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  // Set admin session (for demo, use cookie)
  return NextResponse.json({ success: true }, {
    status: 200,
    headers: {
      "Set-Cookie": `admin-auth=true; Path=/; SameSite=Strict`,
    },
  });
}
