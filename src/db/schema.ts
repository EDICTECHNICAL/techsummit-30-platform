import { pgTable, integer, text, varchar, timestamp, boolean, json, serial } from 'drizzle-orm/pg-core';



// Auth tables for better-auth
export const user = pgTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: false }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: false }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: false }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).notNull().defaultNow(),
});

// User roles mapping
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'ADMIN' | 'LEADER' | 'MEMBER'
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Teams
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  college: text('college').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Team members with roles
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'LEADER' | 'MEMBER'
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Team invites
export const teamInvites = pgTable('team_invites', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACCEPTED' | 'DECLINED'
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Rounds
export const rounds = pgTable('rounds', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // 'QUIZ' | 'VOTING' | 'FINAL'
  day: integer('day').notNull(), // 1 | 2
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ACTIVE' | 'COMPLETED'
  startsAt: timestamp('starts_at', { withTimezone: false }),
  endsAt: timestamp('ends_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Quiz questions
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  maxTokenPerQuestion: integer('max_token_per_question').notNull().default(4),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow()
});

// Question options
export const options = pgTable('options', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  order: integer('order').notNull(),
  tokenDeltaMarketing: integer('token_delta_marketing').notNull().default(0),
  tokenDeltaCapital: integer('token_delta_capital').notNull().default(0),
  tokenDeltaTeam: integer('token_delta_team').notNull().default(0),
  tokenDeltaStrategy: integer('token_delta_strategy').notNull().default(0),
  totalScoreDelta: integer('total_score_delta').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Quiz submissions
export const quizSubmissions = pgTable('quiz_submissions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  memberCount: integer('member_count').notNull().default(5),
  answers: json('answers').notNull(), // [{questionId, optionId}]
  rawScore: integer('raw_score').notNull(),
  tokensMarketing: integer('tokens_marketing').notNull().default(0),
  tokensCapital: integer('tokens_capital').notNull().default(0),
  tokensTeam: integer('tokens_team').notNull().default(0),
  tokensStrategy: integer('tokens_strategy').notNull().default(0),
  durationSeconds: integer('duration_seconds').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Pitches for voting round
export const pitches = pgTable('pitches', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  videoUrl: text('video_url'),
  deckUrl: text('deck_url'),
  presentedAt: timestamp('presented_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Votes in voting round
export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(), // +1 or -1
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Token to votes conversions
export const tokenConversions = pgTable('token_conversions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  category: text('category').notNull(), // 'MARKETING' | 'CAPITAL' | 'TEAM' | 'STRATEGY'
  tokensUsed: integer('tokens_used').notNull(),
  votesGained: integer('votes_gained').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Final pitches
export const finalPitches = pgTable('final_pitches', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  presentedAt: timestamp('presented_at', { withTimezone: false }),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Peer ratings for final round
export const peerRatings = pgTable('peer_ratings', {
  id: serial('id').primaryKey(),
  fromTeamId: integer('from_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  toTeamId: integer('to_team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 3-10
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});

// Judge scores
export const judgeScores = pgTable('judge_scores', {
  id: serial('id').primaryKey(),
  judgeName: text('judge_name').notNull(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow()
});