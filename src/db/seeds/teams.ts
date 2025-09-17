import { db } from '@/db';
import { teams, teamMembers } from '@/db/schema';

async function main() {
    const teamData = [
        { name: 'InnovateTech Solutions', college: 'MIT' },
        { name: 'NextGen Dynamics', college: 'Stanford University' },
        { name: 'Quantum Leap Labs', college: 'UC Berkeley' },
        { name: 'Digital Frontier Co', college: 'Harvard University' },
        { name: 'TechPioneers United', college: 'Carnegie Mellon' },
        { name: 'Future Vision Systems', college: 'Georgia Tech' },
        { name: 'Smart Edge Technologies', college: 'University of Washington' },
        { name: 'Breakthrough Innovations', college: 'University of Texas' },
        { name: 'Cyber Nexus Group', college: 'Duke University' },
        { name: 'Advanced Logic Corp', college: 'Northwestern University' },
        { name: 'Disruptive Tech Labs', college: 'University of Michigan' },
        { name: 'Innovation Hub Solutions', college: 'UCLA' }
    ];

    const createdAtBase = new Date('2024-01-10');
    const teamsToInsert = teamData.map((team, index) => ({
        ...team,
        createdAt: new Date(createdAtBase.getTime() + index * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(createdAtBase.getTime() + index * 24 * 60 * 60 * 1000).toISOString()
    }));

    const insertedTeams = await db.insert(teams).values(teamsToInsert).returning();

    const teamMembersData = [];
    const leaderIds = [
        'user_01h4kxt2e8z9y3b1n7m6q5w8r1',
        'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
        'user_01h4kxt2e8z9y3b1n7m6q5w8r9',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s0',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s4',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s8',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t2',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t6',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u0',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u4',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u8',
        'user_01h4kxt2e8z9y3b1n7m6q5w8v2'
    ];

    const memberIds = [
        'user_01h4kxt2e8z9y3b1n7m6q5w8r2', 'user_01h4kxt2e8z9y3b1n7m6q5w8r3',
        'user_01h4kxt2e8z9y3b1n7m6q5w8r4', 'user_01h4kxt2e8z9y3b1n7m6q5w8r5',
        'user_01h4kxt2e8z9y3b1n7m6q5w8r6', 'user_01h4kxt2e8z9y3b1n7m6q5w8r7',
        'user_01h4kxt2e8z9y3b1n7m6q5w8r8', 'user_01h4kxt2e8z9y3b1n7m6q5w8r9',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s0', 'user_01h4kxt2e8z9y3b1n7m6q5w8s1',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s2', 'user_01h4kxt2e8z9y3b1n7m6q5w8s3',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s4', 'user_01h4kxt2e8z9y3b1n7m6q5w8s5',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s6', 'user_01h4kxt2e8z9y3b1n7m6q5w8s7',
        'user_01h4kxt2e8z9y3b1n7m6q5w8s8', 'user_01h4kxt2e8z9y3b1n7m6q5w8s9',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t0', 'user_01h4kxt2e8z9y3b1n7m6q5w8t1',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t2', 'user_01h4kxt2e8z9y3b1n7m6q5w8t3',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t4', 'user_01h4kxt2e8z9y3b1n7m6q5w8t5',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t6', 'user_01h4kxt2e8z9y3b1n7m6q5w8t7',
        'user_01h4kxt2e8z9y3b1n7m6q5w8t8', 'user_01h4kxt2e8z9y3b1n7m6q5w8t9',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u0', 'user_01h4kxt2e8z9y3b1n7m6q5w8u1',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u2', 'user_01h4kxt2e8z9y3b1n7m6q5w8u3',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u4', 'user_01h4kxt2e8z9y3b1n7m6q5w8u5',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u6', 'user_01h4kxt2e8z9y3b1n7m6q5w8u7',
        'user_01h4kxt2e8z9y3b1n7m6q5w8u8', 'user_01h4kxt2e8z9y3b1n7m6q5w8u9',
        'user_01h4kxt2e8z9y3b1n7m6q5w8v0'
    ];

    insertedTeams.forEach((team, teamIndex) => {
        teamMembersData.push({
            teamId: team.id,
            userId: leaderIds[teamIndex],
            role: 'LEADER',
            createdAt: team.createdAt
        });

        const startIdx = teamIndex * 4;
        for (let i = 0; i < 4; i++) {
            teamMembersData.push({
                teamId: team.id,
                userId: memberIds[startIdx + i],
                role: 'MEMBER',
                createdAt: team.createdAt
            });
        }
    });

    await db.insert(teamMembers).values(teamMembersData);

    console.log('✅ Teams and team members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});