"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Users, Target, Award, CheckCircle, AlertTriangle, FileText, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-lg font-semibold">Competition Rules</h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Welcome,</span>
                  <span className="font-medium">{user.name}</span>
                  {user.team && (
                    <Badge variant="secondary">{user.team.name}</Badge>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TECHPRENEUR SUMMIT 2.0
            </h1>
            <h2 className="text-2xl font-semibold mb-4 text-green-600 dark:text-green-400">
              The Startup Strategy League
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              An entrepreneurial strategy game where teams navigate the challenges of building and scaling a startup. 
              Through creativity, strategic decision-making, and resource management, you'll compete to dominate the marketplace and climb the leaderboard.
            </p>
          </div>

          {/* Quick Overview */}
          <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                Competition Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Team Based</h3>
                  <p className="text-sm text-muted-foreground">2-4 members per team</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Multiple Rounds</h3>
                  <p className="text-sm text-muted-foreground">Quiz, Voting & Final rounds</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Competitive</h3>
                  <p className="text-sm text-muted-foreground">Strategic gameplay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competition Structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Competition Structure
              </CardTitle>
              <CardDescription>
                The competition consists of three main phases designed to test different entrepreneurial skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Round 1: Quiz */}
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Knowledge Round (Quiz)</h3>
                  <Badge variant="secondary">Individual</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Test your entrepreneurial knowledge and business acumen through a comprehensive quiz covering startup fundamentals, 
                  market dynamics, and strategic thinking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>20 multiple-choice questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Time limit: 15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Individual scoring contributes to team total</span>
                  </div>
                </div>
              </div>

              {/* Round 2: Voting */}
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Strategy Round (Voting)</h3>
                  <Badge variant="secondary">Team</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Demonstrate strategic thinking by evaluating and voting on various business scenarios, 
                  startup pitches, and market opportunities.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Multiple voting scenarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Team consensus required</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Strategic decision making</span>
                  </div>
                </div>
              </div>

              {/* Round 3: Final */}
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
                  <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Final Round (Presentation)</h3>
                  <Badge variant="secondary">Team</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Present your startup concept, business model, and growth strategy to a panel of judges 
                  and receive peer evaluations from other teams.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>5-minute team presentation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Judge evaluation and scoring</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Peer rating system</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Guidelines */}
          <Card className="mb-8 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertTriangle className="h-5 w-5" />
                Important Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Fair Play</h4>
                    <p className="text-sm text-muted-foreground">All participants must maintain integrity throughout the competition. Any form of cheating or misconduct will result in immediate disqualification.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Time Management</h4>
                    <p className="text-sm text-muted-foreground">Each round has strict time limits. Late submissions or presentations will not be accepted under any circumstances.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Team Collaboration</h4>
                    <p className="text-sm text-muted-foreground">All team members must participate actively. Teams with inactive members may face point deductions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Documentation</h4>
                    <p className="text-sm text-muted-foreground">Keep records of your strategies and decisions. You may be asked to explain your reasoning during evaluations.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring System */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Scoring System
              </CardTitle>
              <CardDescription>
                Understanding how points are awarded across different rounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">30%</div>
                    <div className="text-sm font-medium">Quiz Round</div>
                    <div className="text-xs text-muted-foreground">Individual knowledge</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">30%</div>
                    <div className="text-sm font-medium">Voting Round</div>
                    <div className="text-xs text-muted-foreground">Strategic decisions</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">40%</div>
                    <div className="text-sm font-medium">Final Round</div>
                    <div className="text-xs text-muted-foreground">Presentation & evaluation</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Final ranking is determined by total accumulated points across all rounds
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                For questions, technical issues, or clarifications about the rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">
                  If you encounter any technical issues or have questions about the competition rules, 
                  please contact the organizing team immediately.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Event Organizers Available</Badge>
                  <Badge variant="outline">Technical Support Ready</Badge>
                  <Badge variant="outline">Real-time Assistance</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}