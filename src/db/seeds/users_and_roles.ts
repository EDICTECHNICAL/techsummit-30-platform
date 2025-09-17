import { db } from '@/db';
import { user } from '@/db/schema';

async function main() {
    // Create admin user
    const adminUser = {
        id: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
        username: 'admin',
        name: 'Summit Admin',
        password: 'adminpass', // set a default password or hash
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    // Create team leaders
    const teamLeaders = [
        { id: 'user_02h4kyu3f0a8z4c2d8e7f6g9s2', username: 'alice', name: 'Alice Johnson', password: 'alicepass' },
        { id: 'user_03h4kyv4g1b9y5d3f8g7h0t3u6', username: 'bob', name: 'Bob Smith', password: 'bobpass' },
        { id: 'user_04h4kyw5h2c0z6e4g9h8i1v4x7', username: 'carol', name: 'Carol Williams', password: 'carolpass' },
        { id: 'user_05h4kyx6i3d1a7f5h0i9j2w5y8', username: 'david', name: 'David Brown', password: 'davidpass' },
        { id: 'user_06h4kyy7j4e2b8g6i1j0k3z6a9', username: 'emma', name: 'Emma Davis', password: 'emmapass' },
        { id: 'user_07h4kyz8k5f3c9h7j2k1l4m7b0', username: 'frank', name: 'Frank Miller', password: 'frankpass' },
        { id: 'user_08h4kyz9l6g4d0i8j3l2m5n8c1', username: 'grace', name: 'Grace Wilson', password: 'gracepass' },
        { id: 'user_09h4kyz0m7h5e1j9k4m3n6o9d2', username: 'henry', name: 'Henry Moore', password: 'henrypass' },
        { id: 'user_10h4kyz1n8i6f2k0l5n4o7p0e3', username: 'iris', name: 'Iris Taylor', password: 'irispass' },
        { id: 'user_11h4kyz2o9j7g3l1m6o5p8q1f4', username: 'jack', name: 'Jack Anderson', password: 'jackpass' },
        { id: 'user_12h4kyz3p0k8h4m2n7p6q9r2g5', username: 'karen', name: 'Karen Thomas', password: 'karenpass' },
        { id: 'user_13h4kyz4q1l9i5o3p8q7r0s3h6', username: 'leo', name: 'Leo Jackson', password: 'leopass' },
    ];

    // Create team members
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
    const teamMembers = memberNames.map((name, i) => ({
        id: `user_${String(i + 14).padStart(2, '0')}h4kyz${String(i + 5).padStart(2, '0')}r2m${Math.floor(i/4)+1}q${(i%4)+1}p${i+1}s${Math.floor(i/4)+1}t${(i%4)+1}u${i+1}`,
        username: `member${i+1}`,
        name,
        password: `member${i+1}pass`,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    }));

    // Combine all users
    const allUsers = [adminUser, ...teamLeaders, ...teamMembers];

    // Insert users
    await db.insert(user).values(allUsers);

    // userRoles table removed. No role seeding needed.

    console.log('✅ Users and roles seeder completed successfully');
}
