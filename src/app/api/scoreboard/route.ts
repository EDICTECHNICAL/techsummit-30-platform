import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, votes, tokenConversions, peerRatings, judgeScores } from '@/db/schema';
import { eq, sum, count, avg, sql } from 'drizzle-orm';

// GET handler - Generate token-based leaderboard with cumulative scoring
export async function GET(request: NextRequest) {
  try {
    // Get all teams
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    
    if (allTeams.length === 0) {
      return NextResponse.json({
        leaderboard: [],
        metadata: {
          totalTeams: 0,
          generatedAt: new Date().toISOString(),
          focus: 'Token-based competition with cumulative scoring',
          rankingCriteria: ['Total cumulative score from tokens and judge scores', 'Total votes as tiebreaker'],
          participation: {
            quizSubmissions: 0,
            votingParticipation: 0,
            peerRatings: 0,
            tokenSpending: 0,
          },
          explanation: {
            tokens: 'Cumulative score from 4 token categories earned in quiz',
            voting: 'Original votes plus votes gained from token conversions',
            judgeScores: 'Scores given by judges in final evaluation',
          }
        }
      });
    }

    // Initialize leaderboard data
    const leaderboard = [];

    for (const team of allTeams) {
      const teamId = team.id;
      
      try {
        // Get quiz tokens - these form the base cumulative score
        const quizData = await db
          .select({
            tokensMarketing: quizSubmissions.tokensMarketing,
            tokensCapital: quizSubmissions.tokensCapital,
            tokensTeam: quizSubmissions.tokensTeam,
            tokensStrategy: quizSubmissions.tokensStrategy,
          })
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, teamId))
          .limit(1);
        
        const tokens = quizData.length > 0 ? {
          marketing: quizData[0].tokensMarketing || 0,
          capital: quizData[0].tokensCapital || 0,
          team: quizData[0].tokensTeam || 0,
          strategy: quizData[0].tokensStrategy || 0,
        } : { marketing: 0, capital: 0, team: 0, strategy: 0 };
        
        // Calculate cumulative token score (sum of all 4 categories)
        const cumulativeTokenScore = tokens.marketing + tokens.capital + tokens.team + tokens.strategy;

        // Get voting data (original votes)
        const voteData = await db
          .select({
            totalVotes: sql<number>`COALESCE(SUM(${votes.value}), 0)`,
          })
          .from(votes)
          .where(eq(votes.toTeamId, teamId));

        const originalVotes = Number(voteData[0]?.totalVotes) || 0;

        // Get token conversion votes
        const tokenVoteData = await db
          .select({
            totalTokenVotes: sql<number>`COALESCE(SUM(${tokenConversions.votesGained}), 0)`,
            tokensSpent: sql<number>`COALESCE(SUM(${tokenConversions.tokensUsed}), 0)`,
          })
          .from(tokenConversions)
          .where(eq(tokenConversions.teamId, teamId));

        const votesFromTokens = Number(tokenVoteData[0]?.totalTokenVotes) || 0;
        const tokensSpent = Number(tokenVoteData[0]?.tokensSpent) || 0;
        const totalVotes = originalVotes + votesFromTokens;

        // Calculate remaining tokens
        const tokensRemaining = cumulativeTokenScore - tokensSpent;

        // Get peer ratings
        const peerRatingData = await db
          .select({
            avgRating: sql<number>`COALESCE(AVG(CAST(${peerRatings.rating} AS DECIMAL)), 0)`,
            ratingCount: sql<number>`COALESCE(COUNT(${peerRatings.id}), 0)`,
          })
          .from(peerRatings)
          .where(eq(peerRatings.toTeamId, teamId));

        const peerRatingAvg = Number(peerRatingData[0]?.avgRating) || 0;
        const peerRatingCount = Number(peerRatingData[0]?.ratingCount) || 0;

        // Get judge scores
        const judgeScoreData = await db
          .select({
            totalJudgeScore: sql<number>`COALESCE(SUM(${judgeScores.score}), 0)`,
            avgJudgeScore: sql<number>`COALESCE(AVG(CAST(${judgeScores.score} AS DECIMAL)), 0)`,
            judgeCount: sql<number>`COALESCE(COUNT(${judgeScores.id}), 0)`,
          })
          .from(judgeScores)
          .where(eq(judgeScores.teamId, teamId));

        const totalJudgeScore = Number(judgeScoreData[0]?.totalJudgeScore) || 0;
        const avgJudgeScore = Number(judgeScoreData[0]?.avgJudgeScore) || 0;
        const judgeCount = Number(judgeScoreData[0]?.judgeCount) || 0;

        // Calculate final cumulative score: Token Score + Judge Score
        const finalCumulativeScore = cumulativeTokenScore + totalJudgeScore;

        leaderboard.push({
          rank: 0, // Will be set after sorting
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          tokens: {
            marketing: tokens.marketing,
            capital: tokens.capital,
            team: tokens.team,
            strategy: tokens.strategy,
            total: cumulativeTokenScore,
          },
          tokenActivity: {
            earned: cumulativeTokenScore,
            spent: tokensSpent,
            remaining: tokensRemaining,
          },
          voting: {
            originalVotes: originalVotes,
            votesFromTokens: votesFromTokens,
            totalVotes: totalVotes,
          },
          peerRating: {
            average: Math.round(peerRatingAvg * 100) / 100,
            count: peerRatingCount,
          },
          judgeScores: {
            total: totalJudgeScore,
            average: Math.round(avgJudgeScore * 100) / 100,
            count: judgeCount,
          },
          finalCumulativeScore: finalCumulativeScore,
          hasQuizSubmission: quizData.length > 0,
        });
      } catch (teamError) {
        console.error(`Error processing team ${teamId}:`, teamError);
        // Add team with zero scores if there's an error
        leaderboard.push({
          rank: 0,
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          tokens: { marketing: 0, capital: 0, team: 0, strategy: 0, total: 0 },
          tokenActivity: { earned: 0, spent: 0, remaining: 0 },
          voting: { originalVotes: 0, votesFromTokens: 0, totalVotes: 0 },
          peerRating: { average: 0, count: 0 },
          judgeScores: { total: 0, average: 0, count: 0 },
          finalCumulativeScore: 0,
          hasQuizSubmission: false,
        });
      }
    }

    // Sort by final cumulative score DESC, then by total votes DESC (tiebreaker)
    leaderboard.sort((a, b) => {
      if (b.finalCumulativeScore !== a.finalCumulativeScore) {
        return b.finalCumulativeScore - a.finalCumulativeScore;
      }
      // Tiebreaker 1: total votes
      if (b.voting.totalVotes !== a.voting.totalVotes) {
        return b.voting.totalVotes - a.voting.totalVotes;
      }
      // Tiebreaker 2: judge scores
      if (b.judgeScores.total !== a.judgeScores.total) {
        return b.judgeScores.total - a.judgeScores.total;
      }
      // Tiebreaker 3: team name (alphabetical for consistency)
      return a.teamName.localeCompare(b.teamName);
    });

    // Add rankings
    const rankedLeaderboard = leaderboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    // Detect tiebreakers for top 3 positions
    let winnerNotes = [];
    
    // Check for ties in top 3 positions
    for (let position = 1; position <= 3; position++) {
      if (rankedLeaderboard.length >= position) {
        const currentTeam = rankedLeaderboard[position - 1];
        const tiedTeams = rankedLeaderboard.filter(team => 
          team.finalCumulativeScore === currentTeam.finalCumulativeScore
        );
        
        if (tiedTeams.length > 1) {
          const otherTiedTeams = tiedTeams.filter(team => team.rank > position);
          
          if (otherTiedTeams.length > 0) {
            let reason = "";
            const nextBestTeam = otherTiedTeams[0];
            
            if (currentTeam.voting.totalVotes > nextBestTeam.voting.totalVotes) {
              reason = `higher total votes (${currentTeam.voting.totalVotes} vs ${nextBestTeam.voting.totalVotes})`;
            } else if (currentTeam.judgeScores.total > nextBestTeam.judgeScores.total) {
              reason = `higher judge scores (${currentTeam.judgeScores.total} vs ${nextBestTeam.judgeScores.total})`;
            } else {
              reason = `alphabetical order of team name`;
            }
            
            const positionName = position === 1 ? "1st place (Winner)" : 
                               position === 2 ? "2nd place" : "3rd place";
            
            winnerNotes.push({
              position: position,
              type: 'tiebreaker',
              message: `Tiebreaker applied for ${positionName}: ${currentTeam.teamName} placed above ${otherTiedTeams.map(t => t.teamName).join(', ')} due to ${reason}.`,
              tiedScore: currentTeam.finalCumulativeScore,
              tiedTeams: tiedTeams.map(t => ({ name: t.teamName, rank: t.rank }))
            });
          }
        }
      }
    }

    // Calculate participation statistics
    const totalQuizSubmissions = leaderboard.filter(t => t.hasQuizSubmission).length;
    const totalVotingParticipation = leaderboard.filter(t => t.voting.originalVotes > 0 || t.voting.votesFromTokens > 0).length;
    const totalPeerRatings = leaderboard.reduce((sum, t) => sum + t.peerRating.count, 0);
    const totalTokenSpending = leaderboard.filter(t => t.tokenActivity.spent > 0).length;

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      winnerNotes: winnerNotes,
      metadata: {
        totalTeams: allTeams.length,
        generatedAt: new Date().toISOString(),
        focus: 'Token-based competition with cumulative scoring from 4 categories plus judge evaluation',
        rankingCriteria: [
          'Final cumulative score (token score + judge score)',
          'Total votes received (original + token conversions) as tiebreaker',
          'Judge scores total as secondary tiebreaker',
          'Team name alphabetical order as final tiebreaker'
        ],
        participation: {
          quizSubmissions: totalQuizSubmissions,
          votingParticipation: totalVotingParticipation,
          peerRatings: totalPeerRatings,
          tokenSpending: totalTokenSpending,
        },
        explanation: {
          tokens: 'Cumulative sum of Marketing + Capital + Team + Strategy tokens earned through quiz',
          voting: 'Original votes received plus additional votes gained from strategic token conversions',
          judgeScores: 'Total scores awarded by judges during final evaluation round',
          finalScore: 'Sum of cumulative token score and total judge score',
          tiebreakers: 'Automatic tiebreaker resolution applied where teams have identical final scores'
        }
      }
    });
  } catch (error) {
    console.error('GET scoreboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate scoreboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      leaderboard: [],
      metadata: {
        totalTeams: 0,
        generatedAt: new Date().toISOString(),
        error: true,
      }
    }, { status: 500 });
  }
}