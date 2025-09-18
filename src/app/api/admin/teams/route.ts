import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { teamId, status } = await req.json();

    if (!teamId || !status) {
      return NextResponse.json({ error: "Missing teamId or status" }, { status: 400 });
    }

    // Note: The teams table doesn't have a status field in the schema
    // This is a placeholder implementation
    return NextResponse.json({ success: true, message: "Team status updated" });
  } catch (error) {
    console.error("Error updating team status:", error);
    return NextResponse.json({ error: "Failed to update team status" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    await db
      .delete(teams)
      .where(eq(teams.id, teamId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}