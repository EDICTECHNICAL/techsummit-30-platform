import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// User roles mapping
export const userRoles = sqliteTable('user_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'ADMIN' | 'LEADER' | 'MEMBER'
  createdAt: text('created_at').notNull(),
});

// Teams
export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  college: text('college').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Team members with roles
export const teamMembers = sqliteTable('team_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'LEADER' | 'MEMBER'
  createdAt: text('created_at').notNull(),
});

// Team invites
export const teamInvites = sqliteTable('team_invites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: text('created_at').notNull(),
});

// Rounds
export const rounds = sqliteTable('rounds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // 'QUIZ' | 'VOTING' | 'FINAL'
  day: integer('day').notNull(), // 1 | 2
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACTIVE' | 'COMPLETED'
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Quiz questions
export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  maxTokenPerQuestion: integer('max_token_per_question').notNull().default(4),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Question options
export const options = sqliteTable('options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  tokenDeltaMarketing: integer('token_delta_marketing').notNull().default(0),
  tokenDeltaCapital: integer('token_delta_capital').notNull().default(0),
  tokenDeltaTeam: integer('token_delta_team').notNull().default(0),
  tokenDeltaStrategy: integer('token_delta_strategy').notNull().default(0),
  totalScoreDelta: integer('total_score_delta').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

// Quiz submissions
export const quizSubmissions = sqliteTable('quiz_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  memberCount: integer('member_count').notNull().default(5),
  answers: text('answers', { mode: 'json' }).notNull(), // [{questionId, optionId}]
  rawScore: integer('raw_score').notNull(),
  tokensMarketing: integer('tokens_marketing').notNull().default(0),
  tokensCapital: integer('tokens_capital').notNull().default(0),
  tokensTeam: integer('tokens_team').notNull().default(0),
  tokensStrategy: integer('tokens_strategy').notNull().default(0),
  durationSeconds: integer('duration_seconds').notNull(),
  createdAt: text('created_at').notNull(),
});

// Pitches for voting round
export const pitches = sqliteTable('pitches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  videoUrl: text('video_url'),
  deckUrl: text('deck_url'),
  presentedAt: text('presented_at'),
  createdAt: text('created_at').notNull(),
});

// Votes in voting round
export const votes = sqliteTable('votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(), // +1 or -1
  createdAt: text('created_at').notNull(),
});

// Token to votes conversions
export const tokenConversions = sqliteTable('token_conversions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'MARKETING' | 'CAPITAL' | 'TEAM' | 'STRATEGY'
  tokensUsed: integer('tokens_used').notNull(),
  votesGained: integer('votes_gained').notNull(),
  createdAt: text('created_at').notNull(),
});

// Final pitches
export const finalPitches = sqliteTable('final_pitches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  presentedAt: text('presented_at'),
  createdAt: text('created_at').notNull(),
});

// Peer ratings for final round
export const peerRatings = sqliteTable('peer_ratings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 3-10
  createdAt: text('created_at').notNull(),
});

// Judge scores
export const judgeScores = sqliteTable('judge_scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  judgeName: text('judge_name').notNull(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  createdAt: text('created_at').notNull(),
});