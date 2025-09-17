import { db } from '@/db';
import { user, userRoles } from '@/db/schema';

async function main() {
    // Create admin user
    const adminUser = {
        id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
        name: 'Summit Admin',
        email: 'admin@demo.com',
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-01').getTime(),
        updatedAt: new Date('2024-01-01').getTime(),
    };

    // Create team leaders
    const teamLeaders = [
        { id: 'user_02h4kyu3f0a8z4c2d8e7f6g9s2', name: 'Alice Johnson', email: 'leader1@demo.com' },
        { id: 'user_03h4kyv4g1b9y5d3f8g7h0t3u6', name: 'Bob Smith', email: 'leader2@demo.com' },
        { id: 'user_04h4kyw5h2c0z6e4g9h8i1v4x7', name: 'Carol Williams', email: 'leader3@demo.com' },
        { id: 'user_05h4kyx6i3d1a7f5h0i9j2w5y8', name: 'David Brown', email: 'leader4@demo.com' },
        { id: 'user_06h4kyy7j4e2b8g6i1j0k3z6a9', name: 'Emma Davis', email: 'leader5@demo.com' },
        { id: 'user_07h4kyz8k5f3c9h7j2k1l4m7b0', name: 'Frank Miller', email: 'leader6@demo.com' },
        { id: 'user_08h4kyz9l6g4d0i8j3l2m5n8c1', name: 'Grace Wilson', email: 'leader7@demo.com' },
        { id: 'user_09h4kyz0m7h5e1j9k4m3n6o9d2', name: 'Henry Moore', email: 'leader8@demo.com' },
        { id: 'user_10h4kyz1n8i6f2k0l5n4o7p0e3', name: 'Iris Taylor', email: 'leader9@demo.com' },
        { id: 'user_11h4kyz2o9j7g3l1m6o5p8q1f4', name: 'Jack Anderson', email: 'leader10@demo.com' },
        { id: 'user_12h4kyz3p0k8h4m2n7p6q9r2g5', name: 'Karen Thomas', email: 'leader11@demo.com' },
        { id: 'user_13h4kyz4q1l9i5o3p8q7r0s3h6', name: 'Leo Jackson', email: 'leader12@demo.com' },
    ];

    // Create team members
    const teamMembers = [];
    let memberCounter = 1;
    for (let team = 1; team <= 12; team++) {
        for (let member = 1; member <= 4; member++) {
            const memberNames = [
                'Sarah Lee', 'Kevin Chen', 'Maria Garcia', 'James Wright',
                'Linda Kim', 'Robert Jones', 'Patricia Clark', 'Michael Lewis',
                'Jennifer Walker', 'William Hall', 'Dorothy Allen', 'Richard Young',
                'Nancy King', 'Charles Wright', 'Betty Lopez', 'Joseph Hill',
                'Sandra Green', 'Thomas Adams', 'Donna Baker', 'Christopher Nelson',
                'Ashley Carter', 'Daniel Perez', 'Michelle Roberts', 'Matthew Turner',
                'Amanda Phillips', 'David Campbell', 'Jessica Parker', 'John Evans',
                'Melissa Edwards', 'Brian Collins', 'Amy Stewart', 'George Sanchez',
                'Lisa Morris', 'Kenneth Rogers', 'Helen Reed', 'Mark Cook',
                'Karen Morgan', 'Steven Bailey', 'Donna Cooper', 'Paul Rivera',
                'Laura Richardson', 'Andrew Cox', 'Emily Ward', 'Joshua Torres',
                'Kimberly Peterson', 'Kevin Gray', 'Deborah Ramirez', 'Jason James',
            ];
            
            teamMembers.push({
                id: `user_${String(memberCounter + 13).padStart(2, '0')}h4kyz${String(memberCounter + 4).padStart(2, '0')}r2m${team}q${member}p${memberCounter}s${team}t${member}u${memberCounter}`,
                name: memberNames[memberCounter - 1],
                email: `member${memberCounter}@demo.com`,
                emailVerified: true,
                image: null,
                createdAt: new Date('2024-01-15').getTime() + memberCounter * 86400000,
                updatedAt: new Date('2024-01-15').getTime() + memberCounter * 86400000,
            });
            memberCounter++;
        }
    }

    // Process leader data
    const processedLeaders = teamLeaders.map((leader, index) => ({
        ...leader,
        emailVerified: true,
        image: null,
        createdAt: new Date('2024-01-02').getTime() + index * 86400000,
        updatedAt: new Date('2024-01-02').getTime() + index * 86400000,
    }));

    // Combine all users
    const allUsers = [adminUser, ...processedLeaders, ...teamMembers];

    // Insert users
    await db.insert(user).values(allUsers);

    // Create user roles
    const adminRole = {
        userId: adminUser.id,
        role: 'ADMIN',
        createdAt: new Date('2024-01-01').toISOString(),
    };

    const leaderRoles = processedLeaders.map((leader, index) => ({
        userId: leader.id,
        role: 'LEADER',
        createdAt: new Date('2024-01-02').getTime() + index * 86400000,
    }));

    const memberRoles = teamMembers.map((member, index) => ({
        userId: member.id,
        role: 'MEMBER',
        createdAt: new Date('2024-01-15').getTime() + index * 86400000,
    }));

    // Combine all roles
    const allRoles = [adminRole, ...leaderRoles, ...memberRoles];

    // Insert user roles
    await db.insert(userRoles).values(allRoles);

    console.log('✅ Users and roles seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});