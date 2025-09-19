import { NextRequest, NextResponse } from "next/server";

// Judge login credentials - in production, these would be in environment variables or database
const JUDGE_CREDENTIALS = [
  { username: "judge1", password: "judge123" },
  { username: "judge2", password: "judge456" },
  { username: "judge3", password: "judge789" },
  { username: "admin", password: "admin123" } // Admin can also access judge console
];

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        error: "Username and password are required" 
      }, { status: 400 });
    }

    // Check credentials
    const isValid = JUDGE_CREDENTIALS.some(
      cred => cred.username === username && cred.password === password
    );

    if (!isValid) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid judge credentials" 
      }, { status: 401 });
    }

    // Create response with authentication cookies
    const response = NextResponse.json({ 
      success: true, 
      message: "Judge login successful",
      judge: username 
    });

    // Set judge authentication cookie
    response.cookies.set("judge-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Also set admin auth if it's admin login
    if (username === "admin") {
      response.cookies.set("admin-auth", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 // 24 hours
      });
    }

    return response;

  } catch (error) {
    console.error("Judge login error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Login failed" 
    }, { status: 500 });
  }
}