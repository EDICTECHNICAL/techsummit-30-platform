import { db } from '@/db';
import { teamMembers } from '@/db/schema';

async function main() {
    // Clear existing team members
    await db.delete(teamMembers);

    const teamMemberData = [
        // Team 1 (ID: 1)
        {
            teamId: 1,
            userId: 'user_02h4kyu3f0a8z4c2d8e7f6g9s2', // Leader 1
            role: 'LEADER',
            createdAt: new Date('2024-01-15T10:00:00').toISOString(),
        },
        {
            teamId: 1,
            userId: 'user_14h4kyz5j2p8k6v4l9m8n0o1p2', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T10:01:00').toISOString(),
        },
        {
            teamId: 1,
            userId: 'user_15h4kyz6q3m9n7o5w0x1y2z4a5', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T10:02:00').toISOString(),
        },
        {
            teamId: 1,
            userId: 'user_16h4kyz7x4o0p8q6y2z3a4b6c7', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T10:03:00').toISOString(),
        },
        {
            teamId: 1,
            userId: 'user_17h4kyz8e5p1q9r7a3b4c5d8e9', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T10:04:00').toISOString(),
        },

        // Team 2 (ID: 2)
        {
            teamId: 2,
            userId: 'user_03h4kyv4g1b9y5d3f8g7h0t3u6', // Leader 2
            role: 'LEADER',
            createdAt: new Date('2024-01-15T11:00:00').toISOString(),
        },
        {
            teamId: 2,
            userId: 'user_18h4kyz9f6q2r0s8b4c5d6e9f0', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T11:01:00').toISOString(),
        },
        {
            teamId: 2,
            userId: 'user_19h4kyz0g7s3t1u9c5d6e7f0g1', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T11:02:00').toISOString(),
        },
        {
            teamId: 2,
            userId: 'user_20h4kyz1h8u4v2w0d6e7f8g1h2', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T11:03:00').toISOString(),
        },
        {
            teamId: 2,
            userId: 'user_21h4kyz2i9w5x3y1e7f8g0h2i3', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T11:04:00').toISOString(),
        },

        // Team 3 (ID: 3)
        {
            teamId: 3,
            userId: 'user_04h4kyw5h2c0z6e4g9h8i1u4v7', // Leader 3
            role: 'LEADER',
            createdAt: new Date('2024-01-15T12:00:00').toISOString(),
        },
        {
            teamId: 3,
            userId: 'user_22h4kyz3j0x6y4z2f8g0h1i3j4', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T12:01:00').toISOString(),
        },
        {
            teamId: 3,
            userId: 'user_23h4kyz4k1y7z5a3g0h1i2j4k5', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T12:02:00').toISOString(),
        },
        {
            teamId: 3,
            userId: 'user_24h4kyz5l2z8a6b4h1i2j3k5l6', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T12:03:00').toISOString(),
        },
        {
            teamId: 3,
            userId: 'user_25h4kyz6m3a9b7c5i2j3k4l6m7', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T12:04:00').toISOString(),
        },

        // Team 4 (ID: 4)
        {
            teamId: 4,
            userId: 'user_05h4kyx6i3d1a7f5h0i9j2v5w8', // Leader 4
            role: 'LEADER',
            createdAt: new Date('2024-01-15T13:00:00').toISOString(),
        },
        {
            teamId: 4,
            userId: 'user_26h4kyz7n4b0c8d6j3k4l5m7n8', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T13:01:00').toISOString(),
        },
        {
            teamId: 4,
            userId: 'user_27h4kyz8o5c1d9e7k4l5m6n8o9', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T13:02:00').toISOString(),
        },
        {
            teamId: 4,
            userId: 'user_28h4kyz9p6d2e0f8l5m6n7o9p0', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T13:03:00').toISOString(),
        },
        {
            teamId: 4,
            userId: 'user_29h4kyz0q7e3f1g9m6n7o8p0q1', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T13:04:00').toISOString(),
        },

        // Team 5 (ID: 5)
        {
            teamId: 5,
            userId: 'user_06h4kyy7j4e2b8g6i1j0k3x6y9', // Leader 5
            role: 'LEADER',
            createdAt: new Date('2024-01-15T14:00:00').toISOString(),
        },
        {
            teamId: 5,
            userId: 'user_30h4kyz1r8f4g2h0n7o8p9q1r2', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T14:01:00').toISOString(),
        },
        {
            teamId: 5,
            userId: 'user_31h4kyz2s9g5h3j1o8p9q0r2s3', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T14:02:00').toISOString(),
        },
        {
            teamId: 5,
            userId: 'user_32h4kyz3t0h6i4k2p9q0r1s3t4', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T14:03:00').toISOString(),
        },
        {
            teamId: 5,
            userId: 'user_33h4kyz4u1i7j5l3q0r1s2t4u5', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T14:04:00').toISOString(),
        },

        // Team 6 (ID: 6)
        {
            teamId: 6,
            userId: 'user_07h4kyz8k5f3c9h7j2k1l4y7z0', // Leader 6
            role: 'LEADER',
            createdAt: new Date('2024-01-15T15:00:00').toISOString(),
        },
        {
            teamId: 6,
            userId: 'user_34h4kyz5v2j8k6l4r1s2t3u5v6', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T15:01:00').toISOString(),
        },
        {
            teamId: 6,
            userId: 'user_35h4kyz6w3k9l7m5s2t3u4v6w7', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T15:02:00').toISOString(),
        },
        {
            teamId: 6,
            userId: 'user_36h4kyz7x4l0m8n6t3u4v5w7x8', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T15:03:00').toISOString(),
        },
        {
            teamId: 6,
            userId: 'user_37h4kyz8y5m1n9o7u4v5w6x8y9', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T15:04:00').toISOString(),
        },

        // Team 7 (ID: 7)
        {
            teamId: 7,
            userId: 'user_08h4kyz9l6g4d0i8k3l2m5z8a1', // Leader 7
            role: 'LEADER',
            createdAt: new Date('2024-01-15T16:00:00').toISOString(),
        },
        {
            teamId: 7,
            userId: 'user_38h4kyz9z6n2o8p6v5w6x7y9z0', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T16:01:00').toISOString(),
        },
        {
            teamId: 7,
            userId: 'user_39h4kyz0a7o3p9q7w6x7y8z0a1', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T16:02:00').toISOString(),
        },
        {
            teamId: 7,
            userId: 'user_40h4kyz1b8p4q0r8x7y8z9a1b2', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T16:03:00').toISOString(),
        },
        {
            teamId: 7,
            userId: 'user_41h4kyz2c9q5r1s9y8z9a0b1c2', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T16:04:00').toISOString(),
        },

        // Team 8 (ID: 8)
        {
            teamId: 8,
            userId: 'user_09h4kyz0m7h5e1i9l4m3n6a2b4', // Leader 8
            role: 'LEADER',
            createdAt: new Date('2024-01-15T17:00:00').toISOString(),
        },
        {
            teamId: 8,
            userId: 'user_42h4kyz3d0r6s2t0z9a0b1c2d3', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T17:01:00').toISOString(),
        },
        {
            teamId: 8,
            userId: 'user_43h4kyz4e1s7t3u1a0b1c2d3e4', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T17:02:00').toISOString(),
        },
        {
            teamId: 8,
            userId: 'user_44h4kyz5f2t8u4v2b1c2d3e4f5', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T17:03:00').toISOString(),
        },
        {
            teamId: 8,
            userId: 'user_45h4kyz6g3u9v5w3c2d3e4f5g6', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T17:04:00').toISOString(),
        },

        // Team 9 (ID: 9)
        {
            teamId: 9,
            userId: 'user_10h4kyz1n8i6f2j0m5n4o7b3c5', // Leader 9
            role: 'LEADER',
            createdAt: new Date('2024-01-15T18:00:00').toISOString(),
        },
        {
            teamId: 9,
            userId: 'user_46h4kyz7h4v0w6x4d3e4f5g6h7', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T18:01:00').toISOString(),
        },
        {
            teamId: 9,
            userId: 'user_47h4kyz8i5w1x7y5e4f5g6h7i8', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T18:02:00').toISOString(),
        },
        {
            teamId: 9,
            userId: 'user_48h4kyz9j6x2y8z6f5g6h7i8j9', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T18:03:00').toISOString(),
        },
        {
            teamId: 9,
            userId: 'user_49h4kyz0k7y3z9a7g6h7i8j9k0', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T18:04:00').toISOString(),
        },

        // Team 10 (ID: 10)
        {
            teamId: 10,
            userId: 'user_11h4kyz2o9j7g3k1n6o5p8c4d6', // Leader 10
            role: 'LEADER',
            createdAt: new Date('2024-01-15T19:00:00').toISOString(),
        },
        {
            teamId: 10,
            userId: 'user_50h4kyz1l8z4a2b0h7i8j9k0l1', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T19:01:00').toISOString(),
        },
        {
            teamId: 10,
            userId: 'user_51h4kyz2m9a5b3c1i8j9k0l1m2', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T19:02:00').toISOString(),
        },
        {
            teamId: 10,
            userId: 'user_52h4kyz3n0b6c4d2j9k0l1m2n3', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T19:03:00').toISOString(),
        },
        {
            teamId: 10,
            userId: 'user_53h4kyz4o1c7d5e3k0l1m2n3o4', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T19:04:00').toISOString(),
        },

        // Team 11 (ID: 11)
        {
            teamId: 11,
            userId: 'user_12h4kyz3p0k8h4l2o7p6q9d5e7', // Leader 11
            role: 'LEADER',
            createdAt: new Date('2024-01-15T20:00:00').toISOString(),
        },
        {
            teamId: 11,
            userId: 'user_54h4kyz5p2d8e6f4l1m2n3o4p5', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T20:01:00').toISOString(),
        },
        {
            teamId: 11,
            userId: 'user_55h4kyz6q3e9f7g5m2n3o4p5q6', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T20:02:00').toISOString(),
        },
        {
            teamId: 11,
            userId: 'user_56h4kyz7r4f0g8h6n3o4p5q6r7', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T20:03:00').toISOString(),
        },
        {
            teamId: 11,
            userId: 'user_57h4kyz8s5g1h9i7o4p5q6r7s8', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T20:04:00').toISOString(),
        },

        // Team 12 (ID: 12)
        {
            teamId: 12,
            userId: 'user_13h4kyz4q1l9i5o3p8q7r0s3h6', // Leader 12
            role: 'LEADER',
            createdAt: new Date('2024-01-15T21:00:00').toISOString(),
        },
        {
            teamId: 12,
            userId: 'user_58h4kyz9t6h2i0j8p5q6r7s8t9', // Member 1
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T21:01:00').toISOString(),
        },
        {
            teamId: 12,
            userId: 'user_59h4kyz0u7i3j1k9q6r7s8t9u0', // Member 2
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T21:02:00').toISOString(),
        },
        {
            teamId: 12,
            userId: 'user_60h4kyz1v8j4k2l0r7s8t9u0v1', // Member 3
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T21:03:00').toISOString(),
        },
        {
            teamId: 12,
            userId: 'user_61h4kyz2w9k5l3m1s8t9u0v1w2', // Member 4
            role: 'MEMBER',
            createdAt: new Date('2024-01-15T21:04:00').toISOString(),
        },
    ];

    await db.insert(teamMembers).values(teamMemberData);
    
    console.log('✅ Team members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});