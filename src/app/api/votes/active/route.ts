import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Return mock voting status for now
    // In a real implementation, this would check the actual voting state
    const votingStatus = {
      active: false,
      currentTeamId: null,
      timeRemaining: 0
    };

    return NextResponse.json(votingStatus);
  } catch (error) {
    console.error("Error fetching voting status:", error);
    return NextResponse.json({ error: "Failed to fetch voting status" }, { status: 500 });
  }
}