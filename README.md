# TechSummit-30 Platform

A modern, business-style hackathon platform built with Next.js, Drizzle ORM, Supabase, and Tailwind CSS. This project supports leader-only teams, custom authentication, admin console, and comprehensive quiz functionality for entrepreneurial skill assessment.

## ✅ **Latest Update: Production Ready with Full Mobile Responsiveness!**

- **📱 Complete Mobile Optimization**: Fully responsive design for mobile and tablet devices
- **🧪 Inhouse Testing Phase**: Currently undergoing 2-3 days of comprehensive testing
- **🐛 Bug Fixing Pipeline**: Any issues discovered during testing will be addressed before the final event
- **⚡ Real-time WebSocket synchronization** for voting timers between admin and clients
- **🔐 5 Admin accounts** and **5 Judge accounts** pre-created with secure passwords
- **🚀 Production deployment ready** for Vercel with optimized configurations
- **📝 15 comprehensive quiz questions** for Techpreneur Summit 2.0
- **🎯 Token-based scoring system** with 4 categories: Marketing, Capital, Team, Strategy
 - **🎯 Token-based scoring system** with 4 categories: Marketing, Capital, Team, Strategy
 - **🎲 Starting Tokens**: Each team starts the quiz with 3 tokens in each category (Marketing, Capital, Team, Strategy)
- **👥 Concurrent Multi-User Access**: Full support for simultaneous users across all platform features

## 🧪 **Current Status: Testing Phase**

The platform is currently in an intensive **inhouse testing phase** for 2-3 days to ensure:

- ✅ **Mobile Responsiveness**: All features work seamlessly on mobile and tablet devices
- ✅ **Cross-browser Compatibility**: Testing across different browsers and devices
- ✅ **Real-time Features**: WebSocket connections and live updates function properly
- ✅ **Performance Optimization**: Load testing and performance validation
- ✅ **Bug Detection**: Identifying and documenting any issues for immediate resolution
- ✅ **Concurrent Access Testing**: Verifying multi-user interactions work without conflicts

**Post-Testing**: Any bugs or issues discovered during this testing phase will be promptly fixed before the final Techpreneur Summit 2.0 event.

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

## Rating-state migration & smoke tests

This project persists the final rating cycle timer into the database using a single-row canonical pattern. A small, idempotent SQL migration and helper scripts are included to create/ensure the `rating_state` table and to run quick smoke tests.

- Migration file: `drizzle/0005_add_rating_state.sql` — creates the `rating_state` table (idempotent) and seeds a canonical row if the table is empty.
- Apply script: `scripts/apply-rating-state.js` — runs the SQL against `DATABASE_URL` found in `.env.local`. The script will try a normal SSL connection first and automatically retry with permissive SSL (`rejectUnauthorized: false`) if there is a cert-chain issue.

How to run the migration locally (PowerShell):

```powershell
# Uses .env.local in the project root to read DATABASE_URL
node .\scripts\apply-rating-state.js

# Or override DATABASE_URL for a one-off run (PowerShell):
$env:DATABASE_URL='postgresql://user:pass@host:port/dbname'; node .\scripts\apply-rating-state.js
```

Quick verification queries (run in psql or your DB client):

```sql
-- Should print 1
SELECT COUNT(*) FROM rating_state;

-- Inspect canonical row
SELECT * FROM rating_state ORDER BY id LIMIT 5;
```

Smoke tests
- API smoke test: `node scripts/test-rating-api.js` — exercises `GET /api/rating/current` and admin POST actions.
- SSE smoke test: `node scripts/test-rating-sse.js` — connects to the rating SSE stream and validates broadcasts.
- Combined (npm script): `npm run test:smoke` (runs API + SSE smoke tests if present).

Safety notes
- The migration is idempotent but please snapshot/back up your production DB before running any migration.
- The apply script retries with permissive SSL for convenience when connecting to DBs with custom/self-signed certs; prefer validating cert chains in production.


## Features

- **🔐 Authentication**: Custom username/password system
- **👥 Team Management**: Leader-only teams with streamlined structure
- **📱 Mobile-First Design**: Complete mobile and tablet responsiveness across all pages
- **🗽️ Admin Console**: Comprehensive admin panel with full platform control
- **❓ Quiz System**: Token-based entrepreneurial assessment with 4 scoring categories
- **🗳️ Voting Rounds**: Real-time voting for team pitches with WebSocket synchronization
- **🏆 Final Rounds**: Complete scoring and leaderboard system
- **⚡ Real-time Updates**: Server-Sent Events (SSE) for live timer synchronization
- **🎨 Modern UI**: Glassy, responsive dashboard with theme switching
- **📊 Analytics**: Complete platform monitoring and statistics
- **🗄️ Database**: SQL-based schema and seeding for production deployment
- **🔑 Pre-created Accounts**: 5 admin + 5 judge accounts ready for production
- **👥 Concurrent Multi-User Access**: Full support for simultaneous users across all features

## 👥 **Concurrent Multi-User Access**

The platform is designed to handle **multiple simultaneous users** across all major features without conflicts or requiring page refreshes:

### 🗳️ **Round 2 Voting - Full Concurrent Support**
- **Multiple Teams**: All teams can vote simultaneously during active voting periods
- **Real-time Updates**: Server-Sent Events (SSE) broadcast voting state changes instantly
- **Duplicate Prevention**: Teams can only vote once per pitch (enforced at API level)
- **No Conflicts**: Database constraints prevent race conditions between concurrent votes

### 🗽️ **Admin Console - Full Concurrent Support**
- **Multiple Admins**: Several administrators can manage the platform simultaneously
- **Real-time Synchronization**: Centralized timer hook keeps all admin consoles updated
- **Parallel Operations**: Round management, team updates, and user role changes work concurrently
- **Background Refresh**: UI updates immediately with background data synchronization

### 👨‍⚖️ **Judge Scoring - Full Concurrent Support**
- **Multiple Judges**: All judges can submit scores simultaneously during rating cycles
- **Real-time SSE**: Broadcasting of rating phase changes and timer updates
- **Duplicate Prevention**: Judges can only score each team once (API-level validation)
- **Polling Fallback**: Automatic state synchronization when SSE is unavailable

### 🏆 **Finals Round - Full Concurrent Support**
- **Peer Ratings**: Qualified teams can submit peer ratings simultaneously during active phases
- **Judge Scoring**: Judges can score teams concurrently with peer rating periods
- **Real-time Updates**: SSE and polling ensure all users see rating state changes instantly
- **Qualification Validation**: Only top 5 qualified teams can participate in peer rating
 - **Qualification Validation**: Only top 5 qualified teams can participate in peer rating

Note: Finals Qualification rule — the top 70% of teams by ranking qualify for the final presentation round; the bottom 30% will be eliminated.

### ❓ **Quiz System - Full Concurrent Support**
- **Multiple Teams**: All teams can take the quiz simultaneously during active periods
- **Isolated Sessions**: Each team has independent quiz experience with localStorage persistence
- **Progress Preservation**: Quiz progress survives browser refreshes and navigation
- **Duplicate Prevention**: Teams can only submit quiz once (database constraint)
- **Timer Synchronization**: Individual timers with auto-submission on expiration

### 🔄 **Real-time Synchronization Architecture**

**Primary Mechanism**: Server-Sent Events (SSE) for instant updates
**Fallback System**: Polling every 2-5 seconds for state synchronization
**Centralized State**: Shared hooks provide consistent state across all user sessions
**Database Safety**: No blocking constraints - concurrent operations handled safely

**Key Benefits**:
- ✅ **No Page Refreshes Required**: Real-time updates keep all users synchronized
- ✅ **No Race Conditions**: Proper validation prevents conflicts between simultaneous actions
- ✅ **Scalable Architecture**: Supports dozens of concurrent users without performance degradation
- ✅ **Robust Fallbacks**: System continues working even if real-time connections fail

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
- ✅ **Mobile Responsiveness**: Full mobile and tablet optimization implemented
- ✅ **Token Scoring System**: 4-category entrepreneurial assessment
- ✅ **Admin Panel Integration**: Full quiz management through web interface
- ✅ **Database Seeding**: Automated question population via browser console
- ✅ **Production Ready**: Complete platform with all core features functional
- ✅ **Concurrent Access Verified**: All major pages support multiple simultaneous users without conflicts
- ✅ **Real-time Architecture**: SSE + polling system ensures live synchronization across users
- ✅ **Testing Phase**: Currently undergoing comprehensive inhouse testing

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
Built by Pawan Shetty for AXIOS EDIC 

## License

MIT
