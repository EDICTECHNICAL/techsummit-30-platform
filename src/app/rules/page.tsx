"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Users, Target, Award, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

export default function RulesPage() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    setIsPending(true);
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      setUser(null);
    }
    setIsPending(false);
  }, []);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground mobile-padding">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground mobile-padding pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className={`font-bold event-text-gradient mb-4 ${isMobile ? 'text-2xl mobile-title' : 'text-4xl'}`}>
            🏆 TECHPRENEUR SUMMIT 3.0
          </h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-xl'}`}>
            Competition Rules & Guidelines
          </p>
          <div className="mt-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Real World Problem Solving & Entrepreneurial Thinking
          </div>
        </div>

        {/* Event Overview */}
        <div className="mobile-card mb-8" style={{ background: 'var(--event-gradient-primary)' }}>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Event Overview
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 text-white">
            <div>
              <h3 className="font-semibold mb-2">📅 Event Dates</h3>
              <p className="text-blue-100 text-sm">
                <strong>Day 1:</strong> September 25, 2025<br />
                <strong>Day 2:</strong> September 27, 2025
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🎯 Competition Theme</h3>
              <p className="text-blue-100 text-sm">
                The Startup Strategy League<br />
                Real-world problem solving through entrepreneurial innovation
              </p>
            </div>
          </div>
        </div>

        {/* Round 1: Quiz for Tokens */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Round 1: Quiz for Tokens (Day 1)
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Limit & Format
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• <strong>15 questions</strong> in <strong>30 minutes</strong></li>
                <li>• Multiple choice questions with strategic trade-offs</li>
                <li>• Timer cannot be paused once started</li>
                <li>• Auto-submit when time runs out</li>
                <li>• Progress automatically saved (browser refresh safe)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Token Categories & Scoring
              </h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <div className="font-medium text-blue-600 dark:text-blue-400">Marketing</div>
                  <div className="text-xs text-blue-500">Customer acquisition & promotion strategies</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <div className="font-medium text-green-600 dark:text-green-400">Capital</div>
                  <div className="text-xs text-green-500">Financial resources & funding</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                  <div className="font-medium text-purple-600 dark:text-purple-400">Team</div>
                  <div className="text-xs text-purple-500">Human resources & collaboration</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                  <div className="font-medium text-orange-600 dark:text-orange-400">Strategy</div>
                  <div className="text-xs text-orange-500">Business planning & execution</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Each answer choice affects token distribution (-2 to +4 points per category)
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">📋 Quiz Rules</h4>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Only team leaders can take the quiz</li>
                <li>• One attempt per team</li>
                <li>• Maximum possible score: 60 tokens</li>
                <li>• Strategic trade-offs required between categories</li>
                <li>• Results determine starting position for Round 2</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Round 2: Pitch & Voting */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Round 2: 90 Second Pitch & Voting (Day 1)
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🎤 Pitch Format</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• <strong>90 seconds maximum</strong> per team presentation</li>
                <li>• Focus on customer acquisition strategy</li>
                <li>• Present your solution to real-world problems</li>
                <li>• No slides required - verbal presentation only</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🗳️ Voting System</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Vote for teams based on: <em>"Are you the customer for this product?"</em></li>
                <li>• <strong>Yes vote (+1)</strong>: You would buy/use this product</li>
                <li>• <strong>No vote (-1)</strong>: You would not buy/use this product</li>
                <li>• Maximum <strong>3 downvotes (-1)</strong> per team</li>
                <li>• Unlimited upvotes (+1) allowed</li>
                <li>• Cannot vote for your own team</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🪙 Token Conversion</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Convert tokens to additional votes (1 token = 1 vote)</li>
                <li>• Strategic decision: Save tokens vs. gain more votes</li>
                <li>• Token conversion is optional and strategic</li>
                <li>• Converted tokens cannot be recovered</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">🎯 Voting Objectives</h4>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• Evaluate market viability and customer appeal</li>
                <li>• Vote based on real customer perspective</li>
                <li>• Consider: Would you actually pay for this solution?</li>
                <li>• Think about target market and product-market fit</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Round 3: Final Evaluation */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Round 3: Final Evaluation (Day 2)
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🎯 Qualification</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• <strong>Top 5 teams</strong> qualify based on cumulative score from Rounds 1 & 2</li>
                <li>• Remaining teams participate as spectators</li>
                <li>• Qualified teams compete for final rankings</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🎤 Presentation Format</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• <strong>5-minute comprehensive pitch</strong></li>
                <li>• Q&A session with judges</li>
                <li>• Present business model, solution, and growth strategy</li>
                <li>• Demonstrate market understanding and execution plan</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📊 Evaluation Criteria</h3>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 text-sm">
                <div>
                  <h4 className="font-medium mb-2">👥 Peer Rating (3-10 scale)</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Innovation and creativity</li>
                    <li>• Market potential</li>
                    <li>• Presentation quality</li>
                    <li>• Team capability</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">⚖️ Judge Scoring</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    <li>• Business viability</li>
                    <li>• Technical feasibility</li>
                    <li>• Market opportunity</li>
                    <li>• Execution strategy</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">🏆 Final Scoring</h4>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Total Score = Token Score (Round 1) + Vote Score (Round 2) + Peer Rating (Round 3) + Judge Score (Round 3)
              </p>
            </div>
          </div>
        </div>

        {/* General Rules */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">📋 General Competition Rules</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">👥 Team Structure</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Only <strong>team leaders</strong> have platform access</li>
                <li>• Leaders represent their entire team in all rounds</li>
                <li>• Team members support and collaborate with leader</li>
                <li>• One team leader per registered team</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">⏰ Time Management</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• All rounds have strict time limits</li>
                <li>• Platform automatically enforces timing</li>
                <li>• Late submissions are not accepted</li>
                <li>• Real-time status updates throughout competition</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🔒 Platform Access</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Unique login credentials for each team leader</li>
                <li>• Platform accessible on mobile, tablet, and desktop</li>
                <li>• Real-time synchronization across devices</li>
                <li>• Automatic progress saving</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🏅 Scoring & Rankings</h3>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Transparent scoring system with live leaderboard</li>
                <li>• Cumulative scoring across all rounds</li>
                <li>• Tie-breaking based on Round 3 performance</li>
                <li>• Final rankings determine competition winners</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code of Conduct */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">🤝 Code of Conduct</h2>
          
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">🚫 Prohibited Actions</h3>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                <li>• Sharing login credentials with other teams</li>
                <li>• Attempting to manipulate voting or scoring systems</li>
                <li>• Disrupting other teams' presentations</li>
                <li>• Plagiarizing ideas or solutions</li>
                <li>• Using inappropriate or offensive content</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Encouraged Behavior</h3>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• Respectful interaction with all participants</li>
                <li>• Creative and innovative problem-solving</li>
                <li>• Constructive feedback during Q&A sessions</li>
                <li>• Fair and honest voting based on merit</li>
                <li>• Collaborative learning and networking</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> Violation of competition rules may result in team disqualification. 
              All decisions by judges and organizers are final.
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="mobile-card mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">📞 Contact & Support</h2>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold mb-2">🛠️ Technical Support</h3>
              <p className="text-sm text-muted-foreground">
                For platform issues, login problems, or technical difficulties, 
                contact the technical support team immediately.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">❓ Competition Questions</h3>
              <p className="text-sm text-muted-foreground">
                For rule clarifications, scoring questions, or general competition inquiries, 
                reach out to the organizing committee.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Emergency Contact:</strong> Technical support team will be available 
                throughout the competition for immediate assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="text-center space-y-4">
          <div className={`flex justify-center gap-4 ${isMobile ? 'flex-col' : ''}`}>
            <Link 
              href="/dashboard" 
              className="event-button-primary rounded-md px-6 py-3 font-medium transition-colors min-h-[44px] flex items-center justify-center"
            >
              Return to Dashboard
            </Link>
            <Link 
              href="/scoreboard" 
              className="inline-flex items-center justify-center rounded-md border border-border bg-card/50 backdrop-blur-sm px-6 py-3 font-medium hover:bg-accent transition-colors min-h-[44px]"
            >
              View Live Scoreboard
            </Link>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Good luck to all teams! May the best entrepreneur win! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}