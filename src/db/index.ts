import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL!;

// Optimized connection pool configuration
const client = postgres(connectionString, { 
  ssl: 'require',
  max: 20,           // Maximum pool size for concurrent connections
  idle_timeout: 20,  // Close idle connections after 20 seconds
  connect_timeout: 30, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Maximum connection lifetime (30 minutes)
  prepare: false,    // Disable prepared statements for better serverless compatibility
});

export const db = drizzle(client, { schema });

export type Database = typeof db;