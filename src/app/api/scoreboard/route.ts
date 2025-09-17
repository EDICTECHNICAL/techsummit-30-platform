import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { teams, quizSubmissions, votes, tokenConversions, peerRatings, judgeScores } from '@/db/schema';
import { eq, sum, count, avg } from 'drizzle-orm';

// GET handler - Generate comprehensive scoreboard
export async function GET(request: NextRequest) {
  try {
    // Get all teams
    const allTeams = await db.select().from(teams);
    
    // Initialize scoreboard data
    const scoreboard = [];

    for (const team of allTeams) {
      const teamId = team.id;
      
      // Get quiz score
      const quizData = await db
        .select()
        .from(quizSubmissions)
        .where(eq(quizSubmissions.teamId, teamId))
        .limit(1);
      
      const quizScore = quizData.length > 0 ? quizData[0].rawScore : 0;

      // Get voting data
      const voteData = await db
        .select({
          totalVotes: sum(votes.value),
          voteCount: count(votes.id),
        })
        .from(votes)
        .where(eq(votes.toTeamId, teamId));

      const originalVotes = voteData[0]?.totalVotes || 0;

      // Get token conversion votes
      const tokenVoteData = await db
        .select({
          totalTokenVotes: sum(tokenConversions.votesGained),
        })
        .from(tokenConversions)
        .where(eq(tokenConversions.teamId, teamId));

      const tokenVotes = tokenVoteData[0]?.totalTokenVotes || 0;
      const totalVotes = originalVotes + tokenVotes;

      // Get peer ratings
      const peerRatingData = await db
        .select({
          avgRating: avg(peerRatings.rating),
          ratingCount: count(peerRatings.id),
        })
        .from(peerRatings)
        .where(eq(peerRatings.toTeamId, teamId));

      const peerRatingAvg = peerRatingData[0]?.avgRating || 0;

      // Get judge scores
      const judgeScoreData = await db
        .select({
          totalJudgeScore: sum(judgeScores.score),
          judgeCount: count(judgeScores.id),
        })
        .from(judgeScores)
        .where(eq(judgeScores.teamId, teamId));

      const judgeScoreTotal = judgeScoreData[0]?.totalJudgeScore || 0;

      // Calculate final score with equal weights (can be adjusted)
      const quizWeight = 1.0;
      const voteWeight = 1.0;
      const peerRatingWeight = 1.0;
      const judgeScoreWeight = 1.0;

      const finalScore = 
        (quizScore * quizWeight) +
        (totalVotes * voteWeight) +
        (peerRatingAvg * peerRatingWeight) +
        (judgeScoreTotal * judgeScoreWeight);

      scoreboard.push({
        teamId: teamId,
        teamName: team.name,
        college: team.college,
        quizScore: quizScore,
        originalVotes: originalVotes,
        tokenVotes: tokenVotes,
        totalVotes: totalVotes,
        peerRatingAvg: Math.round(peerRatingAvg * 100) / 100,
        judgeScoreTotal: judgeScoreTotal,
        finalScore: Math.round(finalScore * 100) / 100,
        // Components for detailed view
        components: {
          quiz: {
            score: quizScore,
            weight: quizWeight,
            contribution: quizScore * quizWeight,
          },
          voting: {
            originalVotes: originalVotes,
            tokenVotes: tokenVotes,
            totalVotes: totalVotes,
            weight: voteWeight,
            contribution: totalVotes * voteWeight,
          },
          peerRating: {
            average: Math.round(peerRatingAvg * 100) / 100,
            count: peerRatingData[0]?.ratingCount || 0,
            weight: peerRatingWeight,
            contribution: peerRatingAvg * peerRatingWeight,
          },
          judgeScore: {
            total: judgeScoreTotal,
            count: judgeScoreData[0]?.judgeCount || 0,
            weight: judgeScoreWeight,
            contribution: judgeScoreTotal * judgeScoreWeight,
          },
        }
      });
    }

    // Sort by final score DESC, then by original votes DESC (tie-breaker)
    scoreboard.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      // Tie-breaker: higher original votes wins
      return b.originalVotes - a.originalVotes;
    });

    // Add rankings
    const rankedScoreboard = scoreboard.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));

    return NextResponse.json({
      scoreboard: rankedScoreboard,
      metadata: {
        totalTeams: allTeams.length,
        generatedAt: new Date().toISOString(),
        weights: {
          quiz: 1.0,
          voting: 1.0,
          peerRating: 1.0,
          judgeScore: 1.0,
        },
        tieBreaker: 'Original votes (without token conversions)',
      }
    });
  } catch (error) {
    console.error('GET scoreboard error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error }, { status: 500 });
  }
}