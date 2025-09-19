import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { finalPitches, peerRatings, judgeScores, teams } from "@/db/schema";
import { count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("admin-auth=true")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get final pitches count
    const finalPitchesCount = await db
      .select({ count: count() })
      .from(finalPitches);

    // Get peer ratings count
    const peerRatingsCount = await db
      .select({ count: count() })
      .from(peerRatings);

    // Get judge scores count
    const judgeScoresCount = await db
      .select({ count: count() })
      .from(judgeScores);

    // Get teams count for comparison
    const teamsCount = await db
      .select({ count: count() })
      .from(teams);

    const stats = {
      finalPitches: finalPitchesCount[0]?.count || 0,
      peerRatings: peerRatingsCount[0]?.count || 0,
      judgeScores: judgeScoresCount[0]?.count || 0,
      totalTeams: teamsCount[0]?.count || 0,
      pitchCompletion: teamsCount[0]?.count > 0 
        ? Math.round((finalPitchesCount[0]?.count || 0) / teamsCount[0].count * 100)
        : 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching final round stats:", error);
    return NextResponse.json({ 
      error: "Failed to fetch final round statistics",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}