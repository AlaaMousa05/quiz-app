export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_FINALIZED";

// Shared by QuestionCard (taking) and ReviewQuestionCard (post-close review)
// so the A/B/C/D labeling convention has one source.
export const OPTION_LETTERS = ["A", "B", "C", "D"];

export interface QuizSummary {
  id: string;
  title: string;
  classNames: string[];
  timeLimitMinutes: number;
  opensAt: string;
  closesAt: string;
  hasAttempt: boolean;
  attemptStatus?: AttemptStatus;
}

export interface QuizListResponse {
  open: QuizSummary[];
  upcoming: QuizSummary[];
  done: QuizSummary[];
}

export interface QuizIntro {
  id: string;
  title: string;
  timeLimitMinutes: number;
  totalPoints: number;
  questionCount: number;
  negMarkEnabled: boolean;
  negMarkPenalty: number;
  opensAt: string;
  closesAt: string;
  hasAttempt: boolean;
  attemptId?: string;
}

export interface AttemptOption {
  id: string;
  text: string;
}

export interface AttemptQuestion {
  id: string;
  text: string;
  points: number;
  options: AttemptOption[];
}

export interface AttemptState {
  quizId: string;
  deadlineAt: string;
  remainingSeconds: number;
  questions: AttemptQuestion[];
  answers: Record<string, string | null>;
}

export interface SubmitResult {
  score: number;
  maxPoints: number;
}

export interface AttemptResult {
  score: number;
  maxPoints: number;
  submittedAt: string | null;
  quizClosesAt: string;
}

export interface ReviewQuestion {
  id: string;
  text: string;
  points: number;
  options: AttemptOption[];
  selectedOptionId: string | null;
  correctOptionId: string;
  pointsAwarded: number;
}

export interface AttemptReview {
  score: number;
  maxPoints: number;
  questions: ReviewQuestion[];
}
