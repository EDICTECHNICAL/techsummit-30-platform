// db-ping.js
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

sql`SELECT 1 as ping`
  .then((result) => {
    console.log('DB connection successful:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
