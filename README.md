
# TechSummit-30 Platform

A modern, business-style hackathon platform built with Next.js, Drizzle ORM, Supabase, and Tailwind CSS. This project supports leader-only teams, custom authentication, admin console, and SQL-based seeding for easy deployment on Supabase.

## Features
- Custom username/password authentication
- Leader-only team management (no teamMembers table)
- Admin console with dedicated admin table
- Quiz, voting, and final rounds
- Glassy, scrollable dashboard UI with theme switch
- SQL-based schema and seed data for Supabase

## Tech Stack
- Next.js
- Drizzle ORM
- Supabase PostgreSQL
- Tailwind CSS
- Node.js

## Getting Started
1. **Clone the repository:**
	```sh
	git clone https://github.com/pawanshettyy/techsummit-30-platform.git
	cd techsummit-30-platform
	```
2. **Install dependencies:**
	```sh
	npm install --legacy-peer-deps
	```
3. **Configure environment:**
	- Set up your Supabase project and get the `DATABASE_URL`.
	- Create a `.env.local` file and add:
	  ```env
	  DATABASE_URL=your_supabase_database_url
	  ```
4. **Set up the database:**
	- Use the provided SQL schema and seed scripts in the Supabase SQL editor to create tables and seed initial data.

## SQL Seeding
- All seed data is provided as SQL scripts for direct use in Supabase.
- See the `/src/db/seeds/` directory for sample data and conversion scripts.

## Running Locally
```sh
npm run dev
```

## Folder Structure
- `src/app/` - Next.js app routes and pages
- `src/components/` - UI components
- `src/db/schema.ts` - Drizzle ORM schema
- `src/db/seeds/` - Seed scripts (convert to SQL for Supabase)

## Admin Accounts
- See the SQL seed script for sample admin accounts.
- Change passwords and usernames as needed for production.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
MIT
