"use client";

import { DashboardNavbar } from "@/components/DashboardNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";
import { AlertTriangle, Clock, Users, Trophy, FileText, Shield, Zap } from "lucide-react";

export default function CompetitionRulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <DashboardNavbar />
      
      <div className="pt-24 pb-12 px-6">
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
                  <p className="text-sm text-muted-foreground">Quiz → Voting → Finals</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Judge Scoring</h3>
                  <p className="text-sm text-muted-foreground">Expert panel evaluation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competition Structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Competition Structure
              </CardTitle>
              <CardDescription>
                The competition consists of three main phases designed to test different aspects of technical knowledge and presentation skills.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Round 1: Quiz */}
              <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="bg-blue-500 text-white border-blue-500">Round 1</Badge>
                  <h3 className="text-xl font-semibold">Technical Quiz</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Duration:</strong> 30 minutes</li>
                  <li>• <strong>Format:</strong> Multiple choice questions</li>
                  <li>• <strong>Topics:</strong> Programming fundamentals, algorithms, data structures, web technologies</li>
                  <li>• <strong>Scoring:</strong> Each correct answer earns tokens</li>
                  <li>• <strong>Team participation:</strong> All members can contribute</li>
                </ul>
              </div>

              {/* Round 2: Voting/Pitching */}
              <div className="border rounded-lg p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="bg-green-500 text-white border-green-500">Round 2</Badge>
                  <h3 className="text-xl font-semibold">Project Pitching & Peer Voting</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Duration:</strong> 1.5 minutes per team presentation</li>
                  <li>• <strong>Format:</strong> Live presentation + Q&A</li>
                  <li>• <strong>Content:</strong> Present your innovative project idea or solution</li>
                  <li>• <strong>Voting:</strong> Teams vote for other teams (cannot vote for themselves)</li>
                  <li>• <strong>Scoring:</strong> Peer votes contribute to overall score</li>
                </ul>
              </div>

              {/* Round 3: Finals */}
              <div className="border rounded-lg p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="bg-purple-500 text-white border-purple-500">Round 3</Badge>
                  <h3 className="text-xl font-semibold">Finals - Judge Evaluation</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Participants:</strong> Top qualifying teams from previous rounds</li>
                  <li>• <strong>Duration:</strong> 5 minutes per team (3 min presentation + 2 min Q&A)</li>
                  <li>• <strong>Format:</strong> Comprehensive project demonstration</li>
                  <li>• <strong>Evaluation:</strong> Expert judges rate on multiple criteria</li>
                  <li>• <strong>Scoring:</strong> Professional evaluation determines final rankings</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Scoring System */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Scoring System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400">Token Score (Quiz)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Correct answers earn tokens</li>
                      <li>• Cumulative team score</li>
                      <li>• Real-time scoring updates</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600 dark:text-green-400">Judge Score (Finals)</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Multiple evaluation criteria</li>
                      <li>• Expert panel assessment</li>
                      <li>• Final ranking determination</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Combined Scoring</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Final Score = Token Score + Judge Score</strong><br />
                    Both components contribute equally to determine the overall winner.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rules & Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Competition Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600 dark:text-blue-400">Team Formation</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Teams must consist of 2-4 members</li>
                    <li>• All team members must be registered participants</li>
                    <li>• Team composition cannot be changed after registration closes</li>
                    <li>• Each participant can only be part of one team</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-green-600 dark:text-green-400">Fair Play</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• No external assistance during quiz rounds</li>
                    <li>• Original work only - plagiarism will result in disqualification</li>
                    <li>• Teams cannot vote for themselves in peer voting</li>
                    <li>• Respectful behavior towards all participants and judges</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-purple-600 dark:text-purple-400">Technical Requirements</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Stable internet connection required for all rounds</li>
                    <li>• Compatible device for accessing the competition platform</li>
                    <li>• Presentation materials must be family-friendly and professional</li>
                    <li>• Time limits are strictly enforced</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-red-600 dark:text-red-400">Disqualification Criteria</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• Cheating or attempting to manipulate the system</li>
                    <li>• Inappropriate or offensive content in presentations</li>
                    <li>• Violation of code of conduct</li>
                    <li>• Technical interference with other teams</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>• <strong>Platform Access:</strong> Ensure you can access the competition platform before the event begins.</p>
                <p>• <strong>Time Zones:</strong> All times are displayed in your local timezone. Please verify event timing.</p>
                <p>• <strong>Technical Support:</strong> Contact organizers immediately if you experience technical difficulties.</p>
                <p>• <strong>Judge Decisions:</strong> All judge decisions are final and cannot be appealed.</p>
                <p>• <strong>Updates:</strong> Rules may be updated before the competition. Check this page regularly.</p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ready to Compete?</h3>
            <p className="text-muted-foreground mb-4">
              May the best team win! Good luck to all participants in TechSummit 30.
            </p>
            <div className="text-sm text-muted-foreground">
              Last updated: September 2025 | Questions? Contact the organizing team
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}