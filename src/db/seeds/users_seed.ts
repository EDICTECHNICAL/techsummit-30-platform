import { drizzle } from 'drizzle-orm/node-postgres';
import { user } from '../schema';
import { hashSync } from 'bcryptjs';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seedUsers() {
  await db.insert(user).values([
    {
      id: 'user-1',
      username: 'alice',
      name: 'Alice',
      image: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      // password: 'password123' (hashed below)
    },
    {
      id: 'user-2',
      username: 'bob',
      name: 'Bob',
      image: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      // password: 'password456' (hashed below)
    }
  ]);
  console.log('Seeded users');
}

seedUsers().then(() => process.exit(0));
