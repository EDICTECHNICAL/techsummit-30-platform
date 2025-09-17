import { db } from '@/db';
import { quizSubmissions, votes, tokenConversions, peerRatings, judgeScores } from '@/db/schema';

async function main() {
    const sampleQuizSubmissions = [
        {
            teamId: 1,
            memberCount: 5,
            answers: JSON.stringify([
                { questionId: 1, optionId: 2 },
                { questionId: 2, optionId: 3 },
                { questionId: 3, optionId: 1 },
                { questionId: 4, optionId: 4 },
                { questionId: 5, optionId: 2 },
                { questionId: 6, optionId: 3 },
                { questionId: 7, optionId: 1 },
                { questionId: 8, optionId: 4 },
                { questionId: 9, optionId: 2 },
                { questionId: 10, optionId: 3 },
                { questionId: 11, optionId: 1 },
                { questionId: 12, optionId: 4 },
                { questionId: 13, optionId: 2 },
                { questionId: 14, optionId: 3 },
                { questionId: 15, optionId: 1 }
            ]),
            rawScore: 45,
            tokensMarketing: 8,
            tokensCapital: 3,
            tokensTeam: 6,
            tokensStrategy: 7,
            durationSeconds: 1200,
            createdAt: new Date('2024-03-15T10:30:00').toISOString(),
        },
        {
            teamId: 2,
            memberCount: 5,
            answers: JSON.stringify([
                { questionId: 1, optionId: 3 },
                { questionId: 2, optionId: 1 },
                { questionId: 3, optionId: 2 },
                { questionId: 4, optionId: 3 },
                { questionId: 5, optionId: 4 },
                { questionId: 6, optionId: 1 },
                { questionId: 7, optionId: 2 },
                { questionId: 8, optionId: 3 },
                { questionId: 9, optionId: 4 },
                { questionId: 10, optionId: 1 },
                { questionId: 11, optionId: 2 },
                { questionId: 12, optionId: 3 },
                { questionId: 13, optionId: 4 },
                { questionId: 14, optionId: 1 },
                { questionId: 15, optionId: 2 }
            ]),
            rawScore: 52,
            tokensMarketing: 6,
            tokensCapital: 5,
            tokensTeam: 8,
            tokensStrategy: 4,
            durationSeconds: 1350,
            createdAt: new Date('2024-03-15T10:35:00').toISOString(),
        },
        {
            teamId: 3,
            memberCount: 5,
            answers: JSON.stringify([
                { questionId: 1, optionId: 1 },
                { questionId: 2, optionId: 4 },
                { questionId: 3, optionId: 3 },
                { questionId: 4, optionId: 2 },
                { questionId: 5, optionId: 1 },
                { questionId: 6, optionId: 4 },
                { questionId: 7, optionId: 3 },
                { questionId: 8, optionId: 2 },
                { questionId: 9, optionId: 1 },
                { questionId: 10, optionId: 4 },
                { questionId: 11, optionId: 3 },
                { questionId: 12, optionId: 2 },
                { questionId: 13, optionId: 1 },
                { questionId: 14, optionId: 4 },
                { questionId: 15, optionId: 3 }
            ]),
            rawScore: 38,
            tokensMarketing: 9,
            tokensCapital: 2,
            tokensTeam: 4,
            tokensStrategy: 8,
            durationSeconds: 1450,
            createdAt: new Date('2024-03-15T10:40:00').toISOString(),
        }
    ];

    const sampleVotes = [
        // Team 1 votes (3 upvotes, 1 downvote)
        { fromTeamId: 2, toTeamId: 1, value: 1, createdAt: new Date('2024-03-16T14:20:00').toISOString() },
        { fromTeamId: 3, toTeamId: 1, value: 1, createdAt: new Date('2024-03-16T14:22:00').toISOString() },
        { fromTeamId: 4, toTeamId: 1, value: 1, createdAt: new Date('2024-03-16T14:25:00').toISOString() },
        { fromTeamId: 5, toTeamId: 1, value: -1, createdAt: new Date('2024-03-16T14:28:00').toISOString() },
        
        // Team 2 votes (5 upvotes, 2 downvotes)
        { fromTeamId: 1, toTeamId: 2, value: 1, createdAt: new Date('2024-03-16T14:21:00').toISOString() },
        { fromTeamId: 3, toTeamId: 2, value: 1, createdAt: new Date('2024-03-16T14:23:00').toISOString() },
        { fromTeamId: 4, toTeamId: 2, value: 1, createdAt: new Date('2024-03-16T14:26:00').toISOString() },
        { fromTeamId: 5, toTeamId: 2, value: 1, createdAt: new Date('2024-03-16T14:27:00').toISOString() },
        { fromTeamId: 6, toTeamId: 2, value: 1, createdAt: new Date('2024-03-16T14:29:00').toISOString() },
        { fromTeamId: 7, toTeamId: 2, value: -1, createdAt: new Date('2024-03-16T14:30:00').toISOString() },
        { fromTeamId: 8, toTeamId: 2, value: -1, createdAt: new Date('2024-03-16T14:32:00').toISOString() },
        
        // Team 3 votes (2 upvotes, 3 downvotes)
        { fromTeamId: 1, toTeamId: 3, value: 1, createdAt: new Date('2024-03-16T14:24:00').toISOString() },
        { fromTeamId: 6, toTeamId: 3, value: 1, createdAt: new Date('2024-03-16T14:31:00').toISOString() },
        { fromTeamId: 7, toTeamId: 3, value: -1, createdAt: new Date('2024-03-16T14:33:00').toISOString() },
        { fromTeamId: 8, toTeamId: 3, value: -1, createdAt: new Date('2024-03-16T14:34:00').toISOString() },
        { fromTeamId: 9, toTeamId: 3, value: -1, createdAt: new Date('2024-03-16T14:35:00').toISOString() },
    ];

    const sampleTokenConversions = [
        {
            teamId: 1,
            category: 'MARKETING',
            tokensUsed: 1,
            votesGained: 1,
            createdAt: new Date('2024-03-16T15:10:00').toISOString(),
        },
        {
            teamId: 2,
            category: 'STRATEGY',
            tokensUsed: 1,
            votesGained: 1,
            createdAt: new Date('2024-03-16T15:15:00').toISOString(),
        },
        {
            teamId: 3,
            category: 'CAPITAL',
            tokensUsed: 1,
            votesGained: 1,
            createdAt: new Date('2024-03-16T15:20:00').toISOString(),
        }
    ];

    const samplePeerRatings = [
        // Team 1 ratings (average 7.5)
        { fromTeamId: 2, toTeamId: 1, rating: 8, createdAt: new Date('2024-03-17T09:15:00').toISOString() },
        { fromTeamId: 3, toTeamId: 1, rating: 7, createdAt: new Date('2024-03-17T09:20:00').toISOString() },
        { fromTeamId: 4, toTeamId: 1, rating: 8, createdAt: new Date('2024-03-17T09:25:00').toISOString() },
        { fromTeamId: 5, toTeamId: 1, rating: 7, createdAt: new Date('2024-03-17T09:30:00').toISOString() },
        
        // Team 2 ratings (average 8.2)
        { fromTeamId: 1, toTeamId: 2, rating: 9, createdAt: new Date('2024-03-17T09:16:00').toISOString() },
        { fromTeamId: 3, toTeamId: 2, rating: 8, createdAt: new Date('2024-03-17T09:21:00').toISOString() },
        { fromTeamId: 4, toTeamId: 2, rating: 8, createdAt: new Date('2024-03-17T09:26:00').toISOString() },
        { fromTeamId: 5, toTeamId: 2, rating: 8, createdAt: new Date('2024-03-17T09:31:00').toISOString() },
        { fromTeamId: 6, toTeamId: 2, rating: 8, createdAt: new Date('2024-03-17T09:35:00').toISOString() },
        
        // Team 3 ratings (average 6.8)
        { fromTeamId: 1, toTeamId: 3, rating: 7, createdAt: new Date('2024-03-17T09:17:00').toISOString() },
        { fromTeamId: 2, toTeamId: 3, rating: 7, createdAt: new Date('2024-03-17T09:22:00').toISOString() },
        { fromTeamId: 4, toTeamId: 3, rating: 6, createdAt: new Date('2024-03-17T09:27:00').toISOString() },
    ];

    const sampleJudgeScores = [
        // Team 1 judge scores (235 total)
        { judgeName: 'Judge A', teamId: 1, score: 75, createdAt: new Date('2024-03-17T16:00:00').toISOString() },
        { judgeName: 'Judge B', teamId: 1, score: 82, createdAt: new Date('2024-03-17T16:05:00').toISOString() },
        { judgeName: 'Judge C', teamId: 1, score: 78, createdAt: new Date('2024-03-17T16:10:00').toISOString() },
        
        // Team 2 judge scores (256 total)
        { judgeName: 'Judge A', teamId: 2, score: 85, createdAt: new Date('2024-03-17T16:01:00').toISOString() },
        { judgeName: 'Judge B', teamId: 2, score: 88, createdAt: new Date('2024-03-17T16:06:00').toISOString() },
        { judgeName: 'Judge C', teamId: 2, score: 83, createdAt: new Date('2024-03-17T16:11:00').toISOString() },
        
        // Team 3 judge scores (210 total)
        { judgeName: 'Judge A', teamId: 3, score: 68, createdAt: new Date('2024-03-17T16:02:00').toISOString() },
        { judgeName: 'Judge B', teamId: 3, score: 72, createdAt: new Date('2024-03-17T16:07:00').toISOString() },
        { judgeName: 'Judge C', teamId: 3, score: 70, createdAt: new Date('2024-03-17T16:12:00').toISOString() },
    ];

    await db.insert(quizSubmissions).values(sampleQuizSubmissions);
    await db.insert(votes).values(sampleVotes);
    await db.insert(tokenConversions).values(sampleTokenConversions);
    await db.insert(peerRatings).values(samplePeerRatings);
    await db.insert(judgeScores).values(sampleJudgeScores);
    
    console.log('✅ Quiz data seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});