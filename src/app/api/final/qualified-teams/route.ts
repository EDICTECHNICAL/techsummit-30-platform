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
          rank: 0, // Will be set below
          quizScore: team.quizScore || 0,
          totalVotes: team.totalVotes || 0,
          votesFromTokens: team.votesFromTokens || 0
        };
      })
      .sort((a, b) => {
        // Primary sort: combined score (descending)
        if (b.combinedScore !== a.combinedScore) {
          return b.combinedScore - a.combinedScore;
        }
        // Tiebreaker 1: Quiz score (descending)
        if (b.quizScore !== a.quizScore) {
          return b.quizScore - a.quizScore;
        }
        // Tiebreaker 2: Total votes (descending)
        if (b.totalVotes !== a.totalVotes) {
          return b.totalVotes - a.totalVotes;
        }
        // Tiebreaker 3: Team name (ascending for consistency)
        return a.teamName.localeCompare(b.teamName);
      })
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    // Detect and resolve ties for 5th position (qualification cutoff)
    let qualificationNote = null;
    if (rankedTeams.length >= 5) {
      const cutoffScore = rankedTeams[4].combinedScore;
      const teamsWithCutoffScore = rankedTeams.filter(team => team.combinedScore === cutoffScore);
      
      if (teamsWithCutoffScore.length > 1) {
        const qualifiedFromTie = teamsWithCutoffScore.filter(team => team.rank <= 5);
        const nonQualifiedFromTie = teamsWithCutoffScore.filter(team => team.rank > 5);
        
        if (qualifiedFromTie.length > 0 && nonQualifiedFromTie.length > 0) {
          // Generate tiebreaker explanation
          const qualifiedTeam = qualifiedFromTie[0];
          const firstNonQualified = nonQualifiedFromTie[0];
          
          let reason = "";
          if (qualifiedTeam.quizScore > firstNonQualified.quizScore) {
            reason = `higher quiz score (${qualifiedTeam.quizScore} vs ${firstNonQualified.quizScore})`;
          } else if (qualifiedTeam.totalVotes > firstNonQualified.totalVotes) {
            reason = `higher total votes (${qualifiedTeam.totalVotes} vs ${firstNonQualified.totalVotes})`;
          } else {
            reason = `alphabetical order of team name`;
          }
          
          qualificationNote = {
            type: 'tiebreaker',
            message: `Tiebreaker applied for 5th position: ${qualifiedTeam.teamName} qualified over ${nonQualifiedFromTie.map(t => t.teamName).join(', ')} due to ${reason}.`,
            tiedScore: cutoffScore,
            tiedTeams: teamsWithCutoffScore.map(t => ({ name: t.teamName, rank: t.rank }))
          };
        }
      }
    }

    // Get top 5 qualified teams
    const top5Teams = rankedTeams.slice(0, 5);
    const nonQualifiedTeams = rankedTeams.slice(5);

    return NextResponse.json({
      qualifiedTeams: top5Teams,
      nonQualifiedTeams: nonQualifiedTeams,
      totalTeams: rankedTeams.length,
      cutoffScore: top5Teams.length > 0 ? top5Teams[top5Teams.length - 1].combinedScore : 0,
      qualificationNote: qualificationNote
    });

  } catch (error) {
    console.error('GET top 5 teams error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch qualified teams',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}