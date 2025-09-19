import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { judges } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and password are required" 
      }, { status: 400 });
    }

    // Check if judge exists in judges table
    const judgeUser = await db.select()
      .from(judges)
      .where(eq(judges.username, username))
      .limit(1);

    if (judgeUser.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid judge credentials" 
      }, { status: 401 });
    }

    const judge = judgeUser[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, judge.password);

    if (!isValidPassword) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid judge credentials" 
      }, { status: 401 });
    }

    // Create response with authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Judge login successful",
      judge: {
        id: judge.id,
        username: judge.username,
        name: judge.name
      }
    });

    // Set judge authentication cookie
    response.cookies.set("judge-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Store judge user data in cookie for session
    response.cookies.set("judge-user", JSON.stringify({
      id: judge.id,
      username: judge.username,
      name: judge.name
    }), {
      httpOnly: false, // Allow client-side access for user data
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error("Judge login error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Login failed" 
    }, { status: 500 });
  }
}