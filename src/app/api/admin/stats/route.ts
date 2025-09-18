import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { teams, user, votes, quizSubmissions, peerRatings, judgeScores } from "@/db/schema";

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
    // Fetch various statistics
    const [
      totalUsers,
      totalTeams,
      totalVotes,
      quizAttempts,
      averageScore,
      highestScore,
      peerRatingsCount,
      judgeScoresCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(user),
      db.select({ count: sql<number>`count(*)` }).from(teams),
      db.select({ count: sql<number>`count(*)` }).from(votes),
      db.select({ count: sql<number>`count(*)` }).from(quizSubmissions),
      db.select({ avg: sql<number>`avg(raw_score)` }).from(quizSubmissions),
      db.select({ max: sql<number>`max(raw_score)` }).from(quizSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(peerRatings),
      db.select({ count: sql<number>`count(*)` }).from(judgeScores)
    ]);

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalTeams: totalTeams[0]?.count || 0,
      totalVotes: totalVotes[0]?.count || 0,
      quizAttempts: quizAttempts[0]?.count || 0,
      completedQuizzes: quizAttempts[0]?.count || 0,
      averageScore: Math.round(averageScore[0]?.avg || 0),
      highestScore: highestScore[0]?.max || 0,
      activeVoters: totalVotes[0]?.count || 0,
      completedPitches: peerRatingsCount[0]?.count || 0,
      peerRatings: peerRatingsCount[0]?.count || 0,
      judgeScores: judgeScoresCount[0]?.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}