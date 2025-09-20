"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Clock, Zap, Eye, Maximize2, Minimize2, CheckCircle, XCircle, Timer, Trophy, Brain } from "lucide-react";
import PageLock from "@/components/ui/PageLock";
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Option {
  id: number;
  text: string;
  order: number;
  tokenDeltaMarketing: number;
  tokenDeltaCapital: number;
  tokenDeltaTeam: number;
  tokenDeltaStrategy: number;
}

interface Question {
  id: number;
  text: string;
  order: number;
  maxTokenPerQuestion: number;
  options: Option[];
}

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  teamId?: number; // Add teamId as fallback
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface QuizResult {
  submission: any;
  tokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
  };
}

// Quiz Header Component
const QuizHeader: React.FC<{ timeLeft: number; isFullscreen: boolean; onToggleFullscreen: () => void }> = ({ 
  timeLeft, 
  isFullscreen, 
  onToggleFullscreen 
}) => (
  <div className="relative group mb-6">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
      <div className="flex items-center gap-4">
        <button
          className="group relative flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg text-primary font-medium hover:bg-primary/20 transition-all duration-200"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          ) : (
            <Maximize2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          )}
          {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
        </button>
      </div>
      <div className={`relative flex items-center gap-3 px-4 py-2 backdrop-blur-sm border rounded-lg font-medium ${
        timeLeft <= 300 
          ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400" 
          : "border-border/50 bg-background/50 text-foreground"
      }`}>
        <Clock className={`w-4 h-4 ${timeLeft <= 300 ? 'animate-pulse' : ''}`} />
        <span>Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
      </div>
    </div>
  </div>
);

// Question Navigation Component
const QuestionNavigation: React.FC<{
  questions: Question[];
  currentQ: number;
  answers: Record<number, number>;
  onQuestionSelect: (index: number) => void;
}> = ({ questions, currentQ, answers, onQuestionSelect }) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className="relative flex flex-col gap-3 min-w-[140px] p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
      <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        Questions
      </h3>
      <div className="grid gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            className={`group relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
              currentQ === idx
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                : answers[q.id]
                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 hover:bg-green-500/20"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 hover:bg-orange-500/20"
            }`}
            onClick={() => onQuestionSelect(idx)}
          >
            <div className="relative flex items-center justify-center gap-2">
              {answers[q.id] && currentQ !== idx && (
                <CheckCircle className="w-3 h-3" />
              )}
              Q{q.order}
            </div>
            {currentQ === idx && (
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// Question Content Component
const QuestionContent: React.FC<{
  question: Question;
  answer: number | undefined;
  onAnswerChange: (optionId: number) => void;
}> = ({ question, answer, onAnswerChange }) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
    <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-black mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Q{question.order}. {question.text}
        </h2>
        <p className="text-muted-foreground bg-primary/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20">
          Select one option. Each choice affects your token allocation.
        </p>
      </div>
      
      <div className="space-y-4">
        {question.options
          .sort((a, b) => a.order - b.order)
          .map((option) => (
            <label 
              key={option.id} 
              className={`group relative flex cursor-pointer items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-1 rounded-xl border backdrop-blur-sm ${
                answer === option.id 
                  ? "border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg" 
                  : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <div className="relative">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answer === option.id}
                  onChange={() => onAnswerChange(option.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  answer === option.id 
                    ? 'border-primary bg-primary' 
                    : 'border-border group-hover:border-primary/50'
                }`}>
                  {answer === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium leading-relaxed">{option.text}</p>
              </div>
              {answer === option.id && (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
            </label>
          ))}
      </div>
    </div>
  </div>
);

// Main Quiz Component
const QuizComponent: React.FC<{
  questions: Question[];
  answers: Record<number, number>;
  onAnswerChange: (questionId: number, optionId: number) => void;
  currentQ: number;
  onCurrentQChange: (index: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  quizActive: boolean;
  timeLeft: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  message: string | null;
}> = ({
  questions,
  answers,
  onAnswerChange,
  currentQ,
  onCurrentQChange,
  onSubmit,
  submitting,
  quizActive,
  timeLeft,
  isFullscreen,
  onToggleFullscreen,
  message
}) => {
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentQ];

  if (questions.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-bold mb-2 text-foreground">Loading Quiz...</h3>
          <p className="text-muted-foreground">Please wait while we load the questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizHeader 
        timeLeft={timeLeft} 
        isFullscreen={isFullscreen} 
        onToggleFullscreen={onToggleFullscreen} 
      />
      
      <div className="flex gap-6 items-start">
        <QuestionNavigation
          questions={questions}
          currentQ={currentQ}
          answers={answers}
          onQuestionSelect={onCurrentQChange}
        />
        
        <div className="flex-1 space-y-6">
          {/* Navigation Controls */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
              <button
                className="group relative flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg text-primary font-medium hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={() => onCurrentQChange(Math.max(0, currentQ - 1))}
                disabled={currentQ === 0}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Previous
              </button>
              
              <span className="text-sm text-muted-foreground font-medium bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
                Question {currentQ + 1} of {questions.length} • {answeredCount}/15 answered
              </span>
              
              <button
                className="group relative flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg text-primary font-medium hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                onClick={() => onCurrentQChange(Math.min(questions.length - 1, currentQ + 1))}
                disabled={currentQ === questions.length - 1}
              >
                Next
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Question Content */}
          {currentQuestion && (
            <QuestionContent
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(optionId) => onAnswerChange(currentQuestion.id, optionId)}
            />
          )}
          
          {/* Progress Bar */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative p-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-sm text-muted-foreground">{answeredCount}/15</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                  style={{ width: `${(answeredCount / 15) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Messages */}
          {message && (
            <div className={`relative group p-4 backdrop-blur-xl border rounded-xl ${
              message.includes('error') || message.includes('failed') 
                ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400" 
                : "border-primary/20 bg-primary/10 text-primary"
            }`}>
              <div className="flex items-center gap-3">
                {message.includes('error') || message.includes('failed') ? (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={onSubmit}
              disabled={submitting || answeredCount !== 15 || !quizActive || timeLeft <= 0}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : timeLeft <= 0 ? (
                  <>
                    <Timer className="w-5 h-5" />
                    Time's Up!
                  </>
                ) : !quizActive ? (
                  <>
                    <XCircle className="w-5 h-5" />
                    Quiz Not Active
                  </>
                ) : answeredCount !== 15 ? (
                  <>
                    <Brain className="w-5 h-5" />
                    Answer All Questions ({answeredCount}/15)
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    Submit Quiz
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Results Component
const QuizResults: React.FC<{ result: QuizResult; onReturnToDashboard: () => void }> = ({ 
  result, 
  onReturnToDashboard 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-6">
    {/* Animated background elements */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
    </div>
    
    <div className="relative max-w-lg w-full">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-green-600 dark:text-green-400 mb-4 border border-green-500/20">
              <CheckCircle className="w-4 h-4" />
              Quiz Completed
            </div>
            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Quiz Completed!
            </h2>
            <p className="text-muted-foreground">
              Your quiz has been submitted successfully!
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-bold text-foreground">Token Distribution</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-500/20">
                  <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Marketing</div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {result.tokens.marketing}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-500/20">
                  <div className="font-bold text-green-600 dark:text-green-400 mb-1">Capital</div>
                  <div className="text-2xl font-black text-green-600 dark:text-green-400">
                    {result.tokens.capital}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20">
                  <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">Team</div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {result.tokens.team}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                  <div className="font-bold text-orange-600 dark:text-orange-400 mb-1">Strategy</div>
                  <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    {result.tokens.strategy}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            className="group relative w-full px-6 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={onReturnToDashboard}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Return to Dashboard
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default function QuizPage() {
  const isMobile = useIsMobile();
  
  // Page lock functionality
  const { isCompleted: isQuizCompleted, loading: roundLoading } = useRoundStatus('QUIZ');

  // Simple modal for rules
  const RulesModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    if (!open) return null;
    
    const handleStartQuiz = () => {
      if (!quizActive) {
        setMessage("Quiz is not currently active. Please wait for the admin to start the quiz.");
        return;
      }
      onClose();
    };
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="relative group max-w-md w-full m-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quiz Rules
              </h2>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>15 questions, 30 minutes total time.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Each option affects your team's token allocation.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Once started, the timer cannot be paused.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Your answers are automatically saved - refreshing the browser won't lose your progress.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>If you close the browser, the timer and answers will resume from where you left off.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Submit before time runs out. Auto-submit on timeout.</span>
              </li>
            </ul>
            
            {!quizActive && (
              <div className="mb-4 p-4 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Quiz is currently pending. Please wait for the admin to activate the quiz before proceeding.
                </p>
              </div>
            )}
            
            <button
              className={`group relative w-full px-6 py-3 font-bold rounded-xl transition-all duration-300 overflow-hidden ${
                quizActive 
                  ? "bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-1" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
              onClick={handleStartQuiz}
              disabled={!quizActive}
            >
              {quizActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              <div className="relative">
                {quizActive ? "I Understand, Start Quiz" : "Quiz Not Available"}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fullscreen Warning Modal Component
  const FullscreenWarningModal: React.FC<{ open: boolean; onStay: () => void; onExit: () => void }> = ({ 
    open, 
    onStay, 
    onExit 
  }) => {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div className="relative group max-w-lg w-full m-4">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl blur opacity-75"></div>
          <div className="relative bg-card/90 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-2xl font-black mb-4 text-red-600 dark:text-red-400">
                Fullscreen Exit Warning
              </h2>
              <div className="mb-6 text-sm text-foreground space-y-3">
                <p className="font-bold text-red-600 dark:text-red-400">
                  You have exited fullscreen mode during the quiz!
                </p>
                <p>
                  For exam integrity, the quiz must be completed in fullscreen mode.
                </p>
                <div className="p-3 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl">
                  <p className="font-bold text-yellow-600 dark:text-yellow-400">
                    WARNING: If you exit fullscreen again, your quiz will be automatically submitted and you will need to contact the nearest event coordinator.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="group relative flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={onStay}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Stay in Quiz</div>
                </button>
                <button
                  className="group relative flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  onClick={onExit}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Exit Quiz</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [quizPending, setQuizPending] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false); // Track if user already submitted
  const [previousSubmission, setPreviousSubmission] = useState<QuizResult | null>(null); // Store previous submission
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRules, setShowRules] = useState(true); // Show rules modal initially
  
  // Fullscreen warning and auto-submission states
  const [fullscreenWarningShown, setFullscreenWarningShown] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [autoSubmissionReason, setAutoSubmissionReason] = useState<string | null>(null);
  
  const quizRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    setIsPending(false);
  }, []);

  // Check if user is a team leader
  // Remove leader check; all users can access

  // Load quiz questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/questions");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setQuestions(data);
      } catch (e) {
        console.error("Failed to load questions:", e);
        setMessage("Failed to load quiz questions. Please refresh the page.");
      }
    };
    fetchQuestions();
  }, []);

  // Check quiz status with real-time polling
  useEffect(() => {
    const fetchQuizStatus = async () => {
      try {
        const res = await fetch("/api/rounds");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rounds = await res.json();
        const quizRound = rounds.find((r: any) => r.name === "QUIZ");
        setQuizActive(quizRound?.status === "ACTIVE");
        setQuizCompleted(quizRound?.status === "COMPLETED");
        setQuizPending(quizRound?.status === "PENDING");
      } catch (e) {
        console.error("Failed to check quiz status:", e);
        setQuizActive(false);
        setQuizCompleted(false);
        setQuizPending(false);
      }
    };
    
    fetchQuizStatus(); // Initial fetch
    
    // Poll every 2 seconds for quiz status changes
    const interval = setInterval(fetchQuizStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if user has already submitted quiz
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      if (!user) return;

      try {
        const teamId = user.team?.id || user.teamId;
        if (!teamId) return;

        const res = await fetch(`/api/quiz/submit?teamId=${teamId}`);
        if (res.ok) {
          const submission = await res.json();
          if (submission) {
            setHasSubmitted(true);
            setPreviousSubmission({
              submission: submission,
              tokens: {
                marketing: submission.tokensMarketing || 0,
                capital: submission.tokensCapital || 0,
                team: submission.tokensTeam || 0,
                strategy: submission.tokensStrategy || 0
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to check previous submission:", e);
      }
    };

    checkPreviousSubmission();
  }, [user]);

  // Timer management with localStorage persistence
  useEffect(() => {
    if (showResult || showRules || hasSubmitted) return;

    // Restore timer from localStorage on mount
    const stored = localStorage.getItem('quiz_time_left');
    if (stored) {
      const savedTime = Number(stored);
      if (savedTime > 0) {
        setTimeLeft(savedTime);
      }
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime > 0 ? prevTime - 1 : 0;
        localStorage.setItem('quiz_time_left', String(newTime));
        // Auto-submit when time runs out
        if (newTime === 0 && Object.keys(answers).length > 0) {
          handleSubmitQuiz();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, showRules, answers, hasSubmitted]);

  // Restore answers from localStorage on mount
  useEffect(() => {
    if (showResult || hasSubmitted) return;

    // Restore previously saved answers
    const storedAnswers = localStorage.getItem('quiz_answers');
    if (storedAnswers) {
      try {
        const parsedAnswers = JSON.parse(storedAnswers);
        // Validate that the answers are in the correct format
        if (typeof parsedAnswers === 'object' && parsedAnswers !== null) {
          const answerCount = Object.keys(parsedAnswers).length;
          setAnswers(parsedAnswers);
          console.log('Restored quiz answers from localStorage:', parsedAnswers);
          
          // Show user feedback about restored progress
          if (answerCount > 0) {
            setMessage(`Progress restored: ${answerCount} question${answerCount === 1 ? '' : 's'} previously answered.`);
            // Clear the message after 3 seconds
            setTimeout(() => setMessage(null), 3000);
          }
        }
      } catch (e) {
        console.error('Failed to parse saved quiz answers:', e);
        // Clear invalid data
        localStorage.removeItem('quiz_answers');
      }
    }
  }, [showResult, hasSubmitted]);

  // Clean up timer on quiz completion
  useEffect(() => {
    if (showResult) {
      localStorage.removeItem('quiz_time_left');
      localStorage.removeItem('quiz_answers');
    }
  }, [showResult]);

  // Clean up answers if user has already submitted
  useEffect(() => {
    if (hasSubmitted) {
      localStorage.removeItem('quiz_answers');
      localStorage.removeItem('quiz_time_left');
    }
  }, [hasSubmitted]);

  // Enhanced fullscreen management with auto-submission
  useEffect(() => {
    if (!quizRef.current) return;
    
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement === quizRef.current;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If user successfully returns to fullscreen, hide the warning modal (but keep warning state)
      if (isCurrentlyFullscreen && quizActive && !quizCompleted && !hasSubmitted && showFullscreenWarning) {
        // Only hide the warning modal, but keep fullscreenWarningShown as true
        setShowFullscreenWarning(false);
      }
      
      // If quiz is active and user exits fullscreen
      if (!isCurrentlyFullscreen && quizActive && !quizCompleted && !hasSubmitted) {
        if (!fullscreenWarningShown) {
          // First time exiting - show warning
          setFullscreenWarningShown(true);
          setShowFullscreenWarning(true);
        } else {
          // Second time exiting - auto submit
          setAutoSubmissionReason("Quiz auto-submitted due to exiting fullscreen mode after warning. Please contact the nearest event coordinator for assistance.");
          handleAutoSubmitQuiz("Fullscreen exit violation after warning");
        }
      }
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [quizActive, quizCompleted, hasSubmitted, fullscreenWarningShown]);

  const toggleFullscreen = () => {
    if (!quizRef.current) return;
    
    if (!isFullscreen) {
      quizRef.current.requestFullscreen().catch((e) => {
        console.error("Failed to enter fullscreen:", e);
      });
    } else {
      document.exitFullscreen().catch((e) => {
        console.error("Failed to exit fullscreen:", e);
      });
    }
  };

  const handleAnswerChange = (questionId: number, optionId: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: optionId };
      // Persist answers to localStorage for browser refresh persistence
      localStorage.setItem('quiz_answers', JSON.stringify(newAnswers));
      return newAnswers;
    });
    setMessage(null); // Clear any existing messages
  };

  const handleSubmitQuiz = async () => {
    if (!quizActive && timeLeft > 0) {
      setMessage("Quiz is not currently active. Please wait for the admin to start the quiz round.");
      return;
    }

    // Check for team ID - handle both nested team object and direct teamId
    const teamId = user?.team?.id || user?.teamId;
    if (!teamId) {
      setMessage("Team ID not found. Please sign out and sign back in.");
      return;
    }

    if (Object.keys(answers).length !== 15) {
      setMessage(`Please answer all questions. You have answered ${Object.keys(answers).length} out of 15.`);
      return;
    }

    setSubmitting(true);
    setMessage("Submitting your quiz...");

    try {
      const payload = {
        teamId: teamId, // Use the resolved teamId
        answers: Object.entries(answers).map(([qid, oid]) => ({
          questionId: Number(qid),
          optionId: oid
        })),
        durationSeconds: 30 * 60 - timeLeft,
      };

      const authToken = localStorage.getItem("auth-token") || btoa(JSON.stringify({ id: user.id }));

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: Submission failed`);
      }

      setResult(data);
      setShowResult(true);
      setMessage(null);
      
      // Set quiz as submitted and lock future attempts
      setHasSubmitted(true);
      setPreviousSubmission(data);
      
      // Clear the quiz state
      localStorage.removeItem('quiz_time_left');
      localStorage.removeItem('quiz_answers');
      
    } catch (error: any) {
      console.error("Quiz submission error:", error);
      setMessage(error?.message || "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-submit function for fullscreen violations
  const handleAutoSubmitQuiz = async (reason: string) => {
    if (hasSubmitted || submitting) return; // Prevent double submission
    
    const teamId = user?.team?.id || user?.teamId;
    if (!teamId) {
      setAutoSubmissionReason("Quiz auto-submitted due to missing team information. Please contact the nearest event coordinator.");
      return;
    }

    setSubmitting(true);
    setMessage("Auto-submitting quiz due to violation...");

    try {
      const payload = {
        teamId: teamId,
        answers: Object.entries(answers).map(([qid, oid]) => ({
          questionId: Number(qid),
          optionId: oid
        })),
        durationSeconds: 30 * 60 - timeLeft,
        autoSubmitted: true,
        submissionReason: reason
      };

      const authToken = localStorage.getItem("auth-token") || btoa(JSON.stringify({ id: user.id }));

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: Auto-submission failed`);
      }

      setResult(data);
      setShowResult(true);
      setMessage(null);
      
      // Set quiz as submitted and lock future attempts
      setHasSubmitted(true);
      setPreviousSubmission(data);
      
      // Clear the quiz state
      localStorage.removeItem('quiz_time_left');
      localStorage.removeItem('quiz_answers');
      
    } catch (error: any) {
      console.error("Auto-submission error:", error);
      setAutoSubmissionReason(`Quiz auto-submitted due to violation, but submission failed: ${error?.message || 'Unknown error'}. Please contact the nearest event coordinator.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Fullscreen warning modal handlers
  const handleStayInQuiz = () => {
    setShowFullscreenWarning(false);
    // Re-enter fullscreen
    if (quizRef.current) {
      quizRef.current.requestFullscreen().catch((e) => {
        console.error("Failed to re-enter fullscreen:", e);
        setMessage("Failed to re-enter fullscreen. Please try manually or contact event coordinator.");
      });
    }
  };

  const handleExitQuiz = () => {
    setShowFullscreenWarning(false);
    setAutoSubmissionReason("Quiz voluntarily submitted after fullscreen exit warning. Please contact the nearest event coordinator if this was unintentional.");
    handleAutoSubmitQuiz("Voluntary submission after fullscreen warning");
  };

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-lg w-full">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-bold mb-2 text-foreground">Loading...</h2>
              <p className="text-muted-foreground">Please wait while we load your quiz.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-6">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-lg w-full">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-2xl">
              <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Please Sign In
              </h2>
              <p className="text-muted-foreground mb-6">
                You need to be signed in to access the quiz portal.
              </p>
              <div className="space-y-3">
                <Link
                  href="/sign-in"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Sign In</div>
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full flex items-center justify-center px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz completed message
  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-6">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-lg w-full">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/50 to-emerald-500/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 text-center shadow-2xl">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-black mb-4 text-green-600 dark:text-green-400">Quiz Round Completed</h2>
              <p className="text-muted-foreground mb-6">
                The quiz round has been completed and is no longer available for new submissions.
              </p>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <Link
                  href="/scoreboard"
                  className="w-full flex items-center justify-center px-6 py-3 bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all duration-300 font-semibold text-green-600 dark:text-green-400"
                >
                  View Scoreboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show quiz already submitted message (lock the quiz)
  if (hasSubmitted && previousSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden flex items-center justify-center p-6">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative max-w-lg w-full">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-75"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 text-center shadow-2xl">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-2xl font-black mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quiz Already Submitted
              </h2>
              <p className="text-muted-foreground mb-6">
                You have already completed and submitted the quiz. Each team can only attempt the quiz once.
              </p>
              
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold text-foreground">Your Results</h3>
                <div className={`grid gap-4 text-sm ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-blue-500/10 backdrop-blur-sm p-4 rounded-xl border border-blue-500/20">
                      <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">Marketing</div>
                      <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                        {previousSubmission.tokens.marketing}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border border-green-500/20">
                      <div className="font-bold text-green-600 dark:text-green-400 mb-1">Capital</div>
                      <div className="text-2xl font-black text-green-600 dark:text-green-400">
                        {previousSubmission.tokens.capital}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-purple-500/10 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20">
                      <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">Team</div>
                      <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        {previousSubmission.tokens.team}
                      </div>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-xl blur opacity-50"></div>
                    <div className="relative bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border border-orange-500/20">
                      <div className="font-bold text-orange-600 dark:text-orange-400 mb-1">Strategy</div>
                      <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                        {previousSubmission.tokens.strategy}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
                  Completed on: {new Date(previousSubmission.submission.createdAt).toLocaleDateString()} at {new Date(previousSubmission.submission.createdAt).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <Link
                  href="/scoreboard"
                  className="w-full flex items-center justify-center px-6 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 font-semibold"
                >
                  View Scoreboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show results (with special handling for auto-submission)
  if (showResult && result) {
    return (
      <div>
        {autoSubmissionReason && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="relative group max-w-2xl w-full m-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/50 to-orange-500/50 rounded-2xl blur opacity-75"></div>
              <div className="relative bg-card/90 backdrop-blur-xl border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20 mb-4">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-4 text-red-600 dark:text-red-400">Quiz Auto-Submitted</h2>
                  <div className="mb-6 text-sm text-foreground space-y-2">
                    <div className="p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {autoSubmissionReason}
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      Your quiz responses have been recorded. Click continue to view your results.
                    </p>
                  </div>
                  <button
                    className="group relative w-full px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    onClick={() => setAutoSubmissionReason(null)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">Continue to Results</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <QuizResults result={result} onReturnToDashboard={handleReturnToDashboard} />
      </div>
    );
  }

  // Block access when quiz is pending to prevent premature timer start and question revelation
  if (quizPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="relative bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-6xl px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Pending Status Message */}
        <div className="relative mx-auto max-w-4xl px-6 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <div className="relative bg-card/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-8 text-center shadow-2xl max-w-lg">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-4">
                Quiz Not Yet Available
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                The quiz is currently in preparation mode. Access will be granted once the round becomes active.
                Please return to the dashboard and wait for the official announcement.
              </p>
              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="group relative w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
                <p className="text-sm text-orange-600 dark:text-orange-400 bg-orange-500/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-orange-500/20">
                  This prevents premature access to questions and timer activation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  return (
    <PageLock roundType="QUIZ" isCompleted={isQuizCompleted}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden mobile-padding pb-20" ref={quizRef}>
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Rules Modal */}
        <RulesModal open={showRules} onClose={() => {
          setShowRules(false);
          // Auto-enter fullscreen when quiz starts
          if (quizRef.current && !isFullscreen) {
            quizRef.current.requestFullscreen().catch((e) => {
              console.error("Failed to auto-enter fullscreen on quiz start:", e);
              setMessage("Warning: Could not enter fullscreen mode. Please manually enter fullscreen for the best quiz experience.");
            });
          }
        }} />

        {/* Fullscreen Warning Modal */}
        <FullscreenWarningModal 
          open={showFullscreenWarning} 
          onStay={handleStayInQuiz}
          onExit={handleExitQuiz}
        />

        {/* Back to Dashboard Button */}
        <div className="relative bg-card/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors group min-h-[44px]">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="relative border-b border-border/50 bg-card/80 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-primary mb-3 border border-primary/20">
                  <Brain className="w-4 h-4" />
                  Round 1 • Quiz Portal
                </div>
                <h1 className={`font-black tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                  Techpreneur Summit 3.0 Quiz
                </h1>
                <p className="text-muted-foreground mt-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 inline-block">
                  15 questions • 30 minutes • Token trade-offs per option
                </p>
              </div>
              <div className={`${isMobile ? 'text-left' : 'text-right'}`}>
                <div className="bg-primary/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-primary/20">
                  <p className="font-bold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Team: {user.team?.name || `Team ID: ${user.teamId || 'None'}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="relative mx-auto max-w-6xl px-6 py-8">
          {!quizActive && !showRules ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative bg-card/80 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 text-center shadow-2xl">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 backdrop-blur-sm px-4 py-2 text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-4 border border-yellow-500/20">
                    <Clock className="w-4 h-4" />
                    Quiz Pending
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">Quiz Not Available</h3>
                  <p className="text-muted-foreground mb-4">
                    The quiz is currently set to pending status. Please wait for the admin to activate the quiz.
                  </p>
                  <p className="text-sm text-muted-foreground bg-yellow-500/5 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-500/20">
                    Contact the event organizers if you believe this is an error.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">Return to Dashboard</div>
                </Link>
              </div>
            </div>
          ) : (
            <QuizComponent
              questions={questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              currentQ={currentQ}
              onCurrentQChange={setCurrentQ}
              onSubmit={handleSubmitQuiz}
              submitting={submitting}
              quizActive={quizActive}
              timeLeft={timeLeft}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              message={message}
            />
          )}
        </div>
      </div>
    </PageLock>
  );
}