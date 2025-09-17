import { db } from '@/db';
import { rounds } from '@/db/schema';

async function main() {
    const sampleRounds = [
        {
            name: 'QUIZ',
            day: 1,
            status: 'PENDING',
            startsAt: null,
            endsAt: null,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'VOTING',
            day: 1,
            status: 'PENDING',
            startsAt: null,
            endsAt: null,
            createdAt: new Date('2024-01-10').toISOString(),
            updatedAt: new Date('2024-01-10').toISOString(),
        },
        {
            name: 'FINAL',
            day: 2,
            status: 'PENDING',
            startsAt: null,
            endsAt: null,
            createdAt: new Date('2024-01-11').toISOString(),
            updatedAt: new Date('2024-01-11').toISOString(),
        }
    ];

    await db.insert(rounds).values(sampleRounds);
    
    console.log('✅ Rounds seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});