import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user, teams } from "@/db/schema";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      })
      .from(user)
      .orderBy(user.createdAt);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, isAdmin } = await req.json();

    if (!userId || typeof isAdmin !== 'boolean') {
      return NextResponse.json({ error: "Missing userId or isAdmin" }, { status: 400 });
    }

    await db
      .update(user)
      .set({ isAdmin })
      .where(eq(user.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
  }
}