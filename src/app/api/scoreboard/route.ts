import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, votes, tokenConversions, peerRatings, judgeScores } from '@/db/schema';
import { eq, sum, count, avg, sql } from 'drizzle-orm';

// GET handler - Generate comprehensive scoreboard
export async function GET(request: NextRequest) {
  try {
    // Get all teams
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    
    if (allTeams.length === 0) {
      return NextResponse.json({
        scoreboard: [],
        metadata: {
          totalTeams: 0,
          generatedAt: new Date().toISOString(),
          message: 'No teams found',
        }
      });
    }

    // Initialize scoreboard data
    const scoreboard = [];

    for (const team of allTeams) {
      const teamId = team.id;
      
      try {
        // Get quiz score
        const quizData = await db
          .select({
            rawScore: quizSubmissions.rawScore,
            tokensMarketing: quizSubmissions.tokensMarketing,
            tokensCapital: quizSubmissions.tokensCapital,
            tokensTeam: quizSubmissions.tokensTeam,
            tokensStrategy: quizSubmissions.tokensStrategy,
          })
          .from(quizSubmissions)
          .where(eq(quizSubmissions.teamId, teamId))
          .limit(1);
        
        const quizScore = quizData.length > 0 ? (quizData[0].rawScore || 0) : 0;
        const tokens = quizData.length > 0 ? {
          marketing: quizData[0].tokensMarketing || 0,
          capital: quizData[0].tokensCapital || 0,
          team: quizData[0].tokensTeam || 0,
          strategy: quizData[0].tokensStrategy || 0,
        } : { marketing: 0, capital: 0, team: 0, strategy: 0 };

        // Get voting data (original votes)
        const voteData = await db
          .select({
            totalVotes: sql<number>`COALESCE(SUM(${votes.value}), 0)`,
            upvotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = 1 THEN 1 ELSE 0 END), 0)`,
            downvotes: sql<number>`COALESCE(SUM(CASE WHEN ${votes.value} = -1 THEN 1 ELSE 0 END), 0)`,
          })
          .from(votes)
          .where(eq(votes.toTeamId, teamId));

        const originalVotes = Number(voteData[0]?.totalVotes) || 0;
        const upvotes = Number(voteData[0]?.upvotes) || 0;
        const downvotes = Number(voteData[0]?.downvotes) || 0;

        // Get token conversion votes
        const tokenVoteData = await db
          .select({
            totalTokenVotes: sql<number>`COALESCE(SUM(${tokenConversions.votesGained}), 0)`,
            conversions: sql<number>`COALESCE(COUNT(${tokenConversions.id}), 0)`,
          })
          .from(tokenConversions)
          .where(eq(tokenConversions.teamId, teamId));

        const tokenVotes = Number(tokenVoteData[0]?.totalTokenVotes) || 0;
        const totalVotes = originalVotes + tokenVotes;

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

        const judgeScoreTotal = Number(judgeScoreData[0]?.totalJudgeScore) || 0;
        const judgeScoreAvg = Number(judgeScoreData[0]?.avgJudgeScore) || 0;
        const judgeCount = Number(judgeScoreData[0]?.judgeCount) || 0;

        // Calculate final score with configurable weights
        const weights = {
          quiz: 1.0,
          voting: 0.5, // Reduced weight for votes
          peerRating: 2.0, // Higher weight for peer ratings
          judgeScore: 3.0, // Highest weight for judge scores
        };

        const normalizedPeerRating = peerRatingCount > 0 ? peerRatingAvg * 10 : 0; // Scale 3-10 rating to 30-100
        const normalizedVotes = Math.max(0, totalVotes); // Ensure non-negative

        const finalScore = 
          (quizScore * weights.quiz) +
          (normalizedVotes * weights.voting) +
          (normalizedPeerRating * weights.peerRating) +
          (judgeScoreTotal * weights.judgeScore);

        scoreboard.push({
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          // Raw scores
          quizScore: quizScore,
          originalVotes: originalVotes,
          tokenVotes: tokenVotes,
          totalVotes: totalVotes,
          upvotes: upvotes,
          downvotes: downvotes,
          peerRatingAvg: Math.round(peerRatingAvg * 100) / 100,
          peerRatingCount: peerRatingCount,
          judgeScoreTotal: judgeScoreTotal,
          judgeScoreAvg: Math.round(judgeScoreAvg * 100) / 100,
          judgeCount: judgeCount,
          finalScore: Math.round(finalScore * 100) / 100,
          // Additional data
          tokens: tokens,
          hasQuizSubmission: quizData.length > 0,
          hasTokenConversion: Number(tokenVoteData[0]?.conversions) > 0,
          // Weighted components for transparency
          components: {
            quiz: {
              score: quizScore,
              weight: weights.quiz,
              contribution: Math.round(quizScore * weights.quiz * 100) / 100,
            },
            voting: {
              originalVotes: originalVotes,
              tokenVotes: tokenVotes,
              totalVotes: totalVotes,
              normalizedVotes: normalizedVotes,
              weight: weights.voting,
              contribution: Math.round(normalizedVotes * weights.voting * 100) / 100,
            },
            peerRating: {
              average: Math.round(peerRatingAvg * 100) / 100,
              normalized: Math.round(normalizedPeerRating * 100) / 100,
              count: peerRatingCount,
              weight: weights.peerRating,
              contribution: Math.round(normalizedPeerRating * weights.peerRating * 100) / 100,
            },
            judgeScore: {
              total: judgeScoreTotal,
              average: Math.round(judgeScoreAvg * 100) / 100,
              count: judgeCount,
              weight: weights.judgeScore,
              contribution: Math.round(judgeScoreTotal * weights.judgeScore * 100) / 100,
            },
          }
        });
      } catch (teamError) {
        console.error(`Error processing team ${teamId}:`, teamError);
        // Add team with zero scores if there's an error
        scoreboard.push({
          teamId: teamId,
          teamName: team.name,
          college: team.college,
          quizScore: 0,
          originalVotes: 0,
          tokenVotes: 0,
          totalVotes: 0,
          upvotes: 0,
          downvotes: 0,
          peerRatingAvg: 0,
          peerRatingCount: 0,
          judgeScoreTotal: 0,
          judgeScoreAvg: 0,
          judgeCount: 0,
          finalScore: 0,
          tokens: { marketing: 0, capital: 0, team: 0, strategy: 0 },
          hasQuizSubmission: false,
          hasTokenConversion: false,
          error: 'Error calculating scores',
          components: {
            quiz: { score: 0, weight: 1.0, contribution: 0 },
            voting: { originalVotes: 0, tokenVotes: 0, totalVotes: 0, normalizedVotes: 0, weight: 0.5, contribution: 0 },
            peerRating: { average: 0, normalized: 0, count: 0, weight: 2.0, contribution: 0 },
            judgeScore: { total: 0, average: 0, count: 0, weight: 3.0, contribution: 0 },
          }
        });
      }
    }

    // Sort by final score DESC, then by quiz score DESC (primary tie-breaker), then by original votes DESC (secondary tie-breaker)
    scoreboard.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      // Primary tie-breaker: quiz score
      if (b.quizScore !== a.quizScore) {
        return b.quizScore - a.quizScore;
      }
      // Secondary tie-breaker: original votes
      return b.originalVotes - a.originalVotes;
    });

    // Add rankings
    const rankedScoreboard = scoreboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    // Calculate summary statistics
    const totalQuizSubmissions = scoreboard.filter(t => t.hasQuizSubmission).length;
    const totalVotingParticipation = scoreboard.filter(t => t.originalVotes > 0 || t.tokenVotes > 0).length;
    const totalPeerRatings = scoreboard.reduce((sum, t) => sum + t.peerRatingCount, 0);
    const totalJudgeScores = scoreboard.reduce((sum, t) => sum + t.judgeCount, 0);

    return NextResponse.json({
      scoreboard: rankedScoreboard,
      metadata: {
        totalTeams: allTeams.length,
        generatedAt: new Date().toISOString(),
        weights: {
          quiz: 1.0,
          voting: 0.5,
          peerRating: 2.0,
          judgeScore: 3.0,
        },
        tieBreakers: [
          'Quiz score (higher wins)',
          'Original votes without token conversions (higher wins)'
        ],
        participation: {
          quizSubmissions: totalQuizSubmissions,
          votingParticipation: totalVotingParticipation,
          peerRatings: totalPeerRatings,
          judgeScores: totalJudgeScores,
        },
        scoringExplanation: {
          quiz: 'Raw quiz score (0-60 points)',
          voting: 'Net votes (upvotes - downvotes + token conversions) × 0.5',
          peerRating: 'Average peer rating (3-10) × 10 × 2.0',
          judgeScore: 'Sum of all judge scores × 3.0',
        }
      }
    });
  } catch (error) {
    console.error('GET scoreboard error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate scoreboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      scoreboard: [],
      metadata: {
        totalTeams: 0,
        generatedAt: new Date().toISOString(),
        error: true,
      }
    }, { status: 500 });
  }
}