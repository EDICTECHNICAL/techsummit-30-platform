"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";

interface Option {
  id: number;
  text: string;
  order: number;
  tokenDeltaMarketing: number;
  tokenDeltaCapital: number;
  tokenDeltaTeam: number;
  tokenDeltaStrategy: number;
  totalScoreDelta: number;
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
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface QuizResult {
  submission: any;
  calculatedScore: number;
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
  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border border-border bg-card">
    <div className="flex items-center gap-4">
      <button
        className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
      </button>
    </div>
    <div className={`rounded-md border px-4 py-2 text-sm font-medium ${timeLeft <= 300 ? "border-red-500 bg-red-500/10 text-red-600" : "border-border bg-background"}`}>
      Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
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
  <div className="flex flex-col gap-2 min-w-[120px]">
    <h3 className="text-sm font-medium text-muted-foreground mb-2">Questions</h3>
    <div className="grid gap-2">
      {questions.map((q, idx) => (
        <button
          key={q.id}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
            currentQ === idx
              ? "bg-primary text-primary-foreground"
              : answers[q.id]
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-card border border-border hover:bg-accent"
          }`}
          onClick={() => onQuestionSelect(idx)}
        >
          Q{q.order}
        </button>
      ))}
    </div>
  </div>
);

// Question Content Component
const QuestionContent: React.FC<{
  question: Question;
  answer: number | undefined;
  onAnswerChange: (optionId: number) => void;
}> = ({ question, answer, onAnswerChange }) => (
  <div className="rounded-lg border border-border bg-card p-6">
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">
        Q{question.order}. {question.text}
      </h2>
      <p className="text-sm text-muted-foreground">
        Select one option. Each choice affects your token allocation.
      </p>
    </div>
    
    <div className="space-y-3">
      {question.options
        .sort((a, b) => a.order - b.order)
        .map((option) => (
          <label 
            key={option.id} 
            className={`flex cursor-pointer items-start gap-4 rounded-md border p-4 transition-colors hover:bg-accent ${
              answer === option.id ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              checked={answer === option.id}
              onChange={() => onAnswerChange(option.id)}
              className="mt-1 h-4 w-4 text-primary"
            />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">{option.text}</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Marketing: {option.tokenDeltaMarketing > 0 ? '+' : ''}{option.tokenDeltaMarketing}</div>
                <div>Capital: {option.tokenDeltaCapital > 0 ? '+' : ''}{option.tokenDeltaCapital}</div>
                <div>Team: {option.tokenDeltaTeam > 0 ? '+' : ''}{option.tokenDeltaTeam}</div>
                <div>Strategy: {option.tokenDeltaStrategy > 0 ? '+' : ''}{option.tokenDeltaStrategy}</div>
              </div>
            </div>
          </label>
        ))}
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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Loading Quiz...</h3>
        <p className="text-muted-foreground">Please wait while we load the questions.</p>
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
          <div className="flex items-center justify-between">
            <button
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
              onClick={() => onCurrentQChange(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
            >
              Previous
            </button>
            
            <span className="text-sm text-muted-foreground">
              Question {currentQ + 1} of {questions.length} • {answeredCount}/15 answered
            </span>
            
            <button
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 transition-colors"
              onClick={() => onCurrentQChange(Math.min(questions.length - 1, currentQ + 1))}
              disabled={currentQ === questions.length - 1}
            >
              Next
            </button>
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
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / 15) * 100}%` }}
            />
          </div>
          
          {/* Messages */}
          {message && (
            <div className={`rounded-md border p-4 text-sm ${
              message.includes('error') || message.includes('failed') 
                ? "border-red-200 bg-red-50 text-red-800" 
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}>
              {message}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={onSubmit}
              disabled={submitting || answeredCount !== 15 || !quizActive || timeLeft <= 0}
              className="inline-flex items-center rounded-md bg-primary px-8 py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </>
              ) : timeLeft <= 0 ? (
                "Time's Up!"
              ) : !quizActive ? (
                "Quiz Not Active"
              ) : answeredCount !== 15 ? (
                `Answer All Questions (${answeredCount}/15)`
              ) : (
                "Submit Quiz"
              )}
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
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
    <div className="max-w-lg w-full">
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 mb-4">
            Quiz Completed
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Score: {result.calculatedScore}/60
          </h2>
          <p className="text-muted-foreground">
            Your quiz has been submitted successfully!
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium">Token Distribution</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium">Marketing</div>
              <div className="text-2xl font-bold text-blue-600">
                {result.tokens.marketing}
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium">Capital</div>
              <div className="text-2xl font-bold text-green-600">
                {result.tokens.capital}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <div className="font-medium">Team</div>
              <div className="text-2xl font-bold text-purple-600">
                {result.tokens.team}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <div className="font-medium">Strategy</div>
              <div className="text-2xl font-bold text-orange-600">
                {result.tokens.strategy}
              </div>
            </div>
          </div>
        </div>
        
        <button
          className="w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          onClick={onReturnToDashboard}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  </div>
);

export default function QuizPage() {
  // Simple modal for rules
  const RulesModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
          <h2 className="text-2xl font-bold mb-4 text-black">Quiz Rules</h2>
          <ul className="list-disc ml-6 mb-4 text-sm text-black">
            <li>15 questions, 30 minutes total time.</li>
            <li>Each option affects your team's token allocation.</li>
            <li>Once started, the timer cannot be paused.</li>
            <li>If you close the browser, the timer will resume from where you left off.</li>
            <li>Submit before time runs out. Auto-submit on timeout.</li>
          </ul>
          <button
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90"
            onClick={onClose}
          >
            I Understand, Start Quiz
          </button>
        </div>
      </div>
    );
  };
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRules, setShowRules] = useState(true); // Show rules modal initially
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

  // Check quiz status
  useEffect(() => {
    const fetchQuizStatus = async () => {
      try {
        const res = await fetch("/api/rounds");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rounds = await res.json();
        const quizRound = rounds.find((r: any) => r.name === "QUIZ");
        setQuizActive(quizRound?.status === "ACTIVE");
      } catch (e) {
        console.error("Failed to check quiz status:", e);
        setQuizActive(false);
      }
    };
    fetchQuizStatus();
  }, []);

  // Timer management with localStorage persistence
  useEffect(() => {
    if (showResult || showRules) return;

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
  }, [showResult, showRules, answers]);

  // Clean up timer on quiz completion
  useEffect(() => {
    if (showResult) {
      localStorage.removeItem('quiz_time_left');
    }
  }, [showResult]);

  // Fullscreen management
  useEffect(() => {
    if (!quizRef.current) return;
    
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === quizRef.current);
    };
    
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    setMessage(null); // Clear any existing messages
  };

  const handleSubmitQuiz = async () => {
    if (!quizActive && timeLeft > 0) {
      setMessage("Quiz is not currently active. Please wait for the admin to start the quiz round.");
      return;
    }

    if (!user?.team?.id) {
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
        teamId: user.team.id,
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
      
      // Clear the quiz state
      localStorage.removeItem('quiz_time_left');
      
    } catch (error: any) {
      console.error("Quiz submission error:", error);
      setMessage(error?.message || "Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToDashboard = () => {
    window.location.href = "/dashboard";
  };

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your quiz.</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access the quiz portal.
          </p>
          <div className="space-y-3">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not a team leader


  // Show results
  if (showResult && result) {
    return <QuizResults result={result} onReturnToDashboard={handleReturnToDashboard} />;
  }

  // Main quiz interface
  return (
    <div className="min-h-screen bg-background text-foreground" ref={quizRef}>
      {/* Rules Modal */}
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
                Round 1 • Quiz Portal
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Techpreneur Summit 3.0 Quiz
              </h1>
              <p className="text-muted-foreground mt-1">
                15 questions • 30 minutes • Token trade-offs per option
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                Team: {user.team?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
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
      </div>
    </div>
  );
}