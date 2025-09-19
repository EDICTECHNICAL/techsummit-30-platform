# TechSummit-30 Platform

A modern, business-style hackathon platform built with Next.js, Drizzle ORM, Supabase, and Tailwind CSS. This project supports leader-only teams, custom authentication, admin console, and comprehensive quiz functionality for entrepreneurial skill assessment.

## ✅ **Latest Update: Production Ready with Real-time WebSockets!**

- **Real-time WebSocket synchronization** for voting timers between admin and clients
- **5 Admin accounts** and **5 Judge accounts** pre-created with secure passwords
- **Production deployment ready** for Vercel with optimized configurations
- **15 comprehensive quiz questions** for Techpreneur Summit 2.0
- **Token-based scoring system** with 4 categories: Marketing, Capital, Team, Strategy

## 🔑 **Pre-created Accounts**

### Admin Accounts

| Username | Password              | Name         |
| -------- | --------------------- | ------------ |
| admin1   | TechSummit2025!Admin1 | Admin User 1 |
| admin2   | TechSummit2025!Admin2 | Admin User 2 |
| admin3   | TechSummit2025!Admin3 | Admin User 3 |
| admin4   | TechSummit2025!Admin4 | Admin User 4 |
| admin5   | TechSummit2025!Admin5 | Admin User 5 |

### Judge Accounts

| Username | Password              | Name         |
| -------- | --------------------- | ------------ |
| judge1   | TechSummit2025!Judge1 | Judge User 1 |
| judge2   | TechSummit2025!Judge2 | Judge User 2 |
| judge3   | TechSummit2025!Judge3 | Judge User 3 |
| judge4   | TechSummit2025!Judge4 | Judge User 4 |
| judge5   | TechSummit2025!Judge5 | Judge User 5 |

## 🚀 **Production Deployment**

### Environment Variables

Create these environment variables in your production environment:

```env
DATABASE_URL=your_production_database_url
NEXTAUTH_SECRET=your_secure_nextauth_secret_32_chars_minimum
NEXTAUTH_URL=https://your-domain.vercel.app
NODE_ENV=production
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Database Setup for Production

```sh
# Run migrations in production
npx drizzle-kit migrate

# Seed accounts (run once after deployment)
node scripts/seed-admin-judge-accounts.js
```

## Features

- **🔐 Authentication**: Custom username/password system
- **👥 Team Management**: Leader-only teams with streamlined structure
- **🛡️ Admin Console**: Comprehensive admin panel with full platform control
- **❓ Quiz System**: Token-based entrepreneurial assessment with 4 scoring categories
- **🗳️ Voting Rounds**: Real-time voting for team pitches with WebSocket synchronization
- **🏆 Final Rounds**: Complete scoring and leaderboard system
- **⚡ Real-time Updates**: Server-Sent Events (SSE) for live timer synchronization
- **🎨 Modern UI**: Glassy, responsive dashboard with theme switching
- **📊 Analytics**: Complete platform monitoring and statistics
- **🗄️ Database**: SQL-based schema and seeding for production deployment
- **🔑 Pre-created Accounts**: 5 admin + 5 judge accounts ready for production

## Tech Stack

- Next.js
- Drizzle ORM
- Supabase PostgreSQL
- Tailwind CSS
- Node.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git for version control

### Installation Steps

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

   - Set up your Supabase project and get the `DATABASE_URL`
   - Create a `.env.local` file and add:
     ```env
     DATABASE_URL=your_supabase_database_url
     ```
4. **Set up the database:**

   ```sh
   # Generate and push schema to database
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```
5. **Seed quiz questions (NEW!):**

   - Start the dev server: `npm run dev`
   - Open browser to `http://localhost:3000/admin`
   - Use browser console to run the seeding script from `/scripts/admin-console-seeder.js`
   - All 15 quiz questions will be automatically added to the database

### Quick Admin Access

- Navigate to `/admin` and set admin cookie: `document.cookie = "admin-auth=true"`
- Access comprehensive admin panel with quiz management, voting control, and analytics

## 🎯 Quiz System Details

### Token-Based Scoring

The platform features a comprehensive quiz system designed for entrepreneurial skill assessment:

- **4 Token Categories**: Marketing, Capital, Team, Strategy
- **15 Strategic Questions**: Covering startup scenarios and decision-making
- **Balanced Scoring**: Token deltas range from -2 to +4 per answer choice
- **Real-time Tracking**: Live token accumulation and category analysis

### Sample Quiz Question

```
"Your startup has limited funds but wants to scale quickly. What will you prioritize first?"

A. Aggressive marketing campaigns     [Marketing +4, Capital -2]
B. Secure seed funding              [Capital +4, Team -2]
C. Build a strong founding team     [Team +4, Strategy -2]
D. Create a lean strategy           [Strategy +4, Marketing -1]
```

### Admin Quiz Management

- **Add/Edit Questions**: Full CRUD operations through admin panel
- **Token Configuration**: Customize scoring for each answer option
- **Progress Monitoring**: Track quiz completion and results
- **Bulk Operations**: Reset all quizzes or export data

## 📊 Platform Architecture

### Database Schema (Drizzle ORM)

- **16 Tables**: Users, teams, rounds, questions, options, votes, pitches, etc.
- **Foreign Key Relationships**: Proper data integrity and cascading
- **Migration Support**: Version-controlled schema changes
- **Seed Scripts**: Automated data population for testing

### API Endpoints

- `/api/admin/*` - Complete admin management
- `/api/quiz/*` - Quiz functionality and scoring
- `/api/voting/*` - Real-time voting system
- `/api/teams/*` - Team management and statistics

## 🚀 Running the Platform

### Development Server

```sh
npm run dev
```

Access the platform at `http://localhost:3000`

### Available Routes

- `/` - Landing page and authentication
- `/dashboard` - User dashboard with quiz access
- `/quiz` - Interactive quiz with token scoring
- `/voting` - Real-time voting interface
- `/final` - Final round and results
- `/admin` - Comprehensive admin console
- `/scoreboard` - Live leaderboard and statistics

### Production Deployment

```sh
npm run build
npm start
```

## 📁 Project Structure

```
techsummit-30-platform/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/             # Admin console
│   │   ├── api/               # API endpoints
│   │   ├── quiz/              # Quiz interface
│   │   └── voting/            # Voting system
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Shadcn/ui components
│   ├── db/                   # Database configuration
│   │   ├── schema.ts         # Drizzle ORM schema
│   │   └── seeds/           # Seed data scripts
│   └── lib/                  # Utility functions
├── scripts/                  # Database and admin scripts
├── drizzle/                 # Migration files
└── public/                  # Static assets
```

## 🔧 Development & Deployment

### Environment Configuration

Create `.env.local` with:

```env
DATABASE_URL=your_supabase_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Database Management

```sh
# Generate migration files
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# View database in Drizzle Studio
npx drizzle-kit studio
```

### Admin System

- **Admin Authentication**: Cookie-based admin access
- **Full Platform Control**: Rounds, voting, teams, users, quiz management
- **Real-time Monitoring**: Live statistics and system health
- **Data Export**: Complete platform data backup functionality

## 🧪 Testing the Quiz System

1. **Start Development Server**:

   ```sh
   npm run dev
   ```
2. **Access Admin Panel**:

   - Navigate to `http://localhost:3000/admin`
   - Set admin cookie: `document.cookie = "admin-auth=true"`
   - Go to Quiz tab to verify all 15 questions are loaded
3. **Test Quiz Functionality**:

   - Create a test user account
   - Navigate to `/quiz` to experience the token-based scoring
   - Complete quiz and view results with token distribution
4. **Verify Database**:

   ```sh
   npx drizzle-kit studio
   ```

   Check `questions` and `options` tables for complete data

## 🎉 Recent Achievements

- ✅ **15 Quiz Questions Added**: Complete Techpreneur Summit 2.0 quiz dataset
- ✅ **Token Scoring System**: 4-category entrepreneurial assessment
- ✅ **Admin Panel Integration**: Full quiz management through web interface
- ✅ **Database Seeding**: Automated question population via browser console
- ✅ **Production Ready**: Complete platform with all core features functional

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
