import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, votes, tokenConversions } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

// GET handler - Get top 5 qualified teams for final round
export async function GET(request: NextRequest) {
  try {
    // Get all teams with their quiz scores and voting results
    const teamsWithScores = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        college: teams.college,
        quizScore: sql<number>`COALESCE(${quizSubmissions.rawScore}, 0)`.as('quiz_score'),
        totalVotes: sql<number>`
          COALESCE(
            (SELECT COUNT(*) FROM ${votes} WHERE ${votes.toTeamId} = ${teams.id} AND ${votes.value} = 1), 0
          ) - COALESCE(
            (SELECT COUNT(*) FROM ${votes} WHERE ${votes.toTeamId} = ${teams.id} AND ${votes.value} = -1), 0
          )
        `.as('total_votes'),
        tokensSpent: sql<number>`
          COALESCE(
            (SELECT SUM(${tokenConversions.tokensUsed}) FROM ${tokenConversions} WHERE ${tokenConversions.teamId} = ${teams.id}), 0
          )
        `.as('tokens_spent'),
        votesFromTokens: sql<number>`
          COALESCE(
            (SELECT SUM(${tokenConversions.votesGained}) FROM ${tokenConversions} WHERE ${tokenConversions.teamId} = ${teams.id}), 0
          )
        `.as('votes_from_tokens')
      })
      .from(teams)
      .leftJoin(quizSubmissions, eq(teams.id, quizSubmissions.teamId))
      .orderBy(teams.id);

    // Calculate combined scores and rank teams
    const rankedTeams = teamsWithScores
      .map(team => {
        const combinedScore = (team.quizScore || 0) + (team.totalVotes || 0) + (team.votesFromTokens || 0);
        return {
          ...team,
          combinedScore,
          rank: 0 // Will be set below
        };
      })
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    // Get top 5 qualified teams
    const top5Teams = rankedTeams.slice(0, 5);
    const nonQualifiedTeams = rankedTeams.slice(5);

    return NextResponse.json({
      qualifiedTeams: top5Teams,
      nonQualifiedTeams: nonQualifiedTeams,
      totalTeams: rankedTeams.length,
      cutoffScore: top5Teams.length > 0 ? top5Teams[top5Teams.length - 1].combinedScore : 0
    });

  } catch (error) {
    console.error('GET top 5 teams error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch qualified teams',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}