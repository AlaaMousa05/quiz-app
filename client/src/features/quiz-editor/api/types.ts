export interface TeacherClass {
  id: string;
  name: string;
}

export interface TeacherQuizListItem {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  classNames: string[];
  attemptCount: number;
  enrolledCount: number;
}

export interface TeacherQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TeacherQuestion {
  id: string;
  text: string;
  points: number;
  options: TeacherQuizOption[];
}

export interface TeacherQuizDetail {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  opensAt: string;
  closesAt: string;
  timeLimitMinutes: number;
  negMarkEnabled: boolean;
  negMarkPenalty: number;
  locked: boolean;
  questions: TeacherQuestion[];
}

export interface QuizSettingsFormInput {
  title: string;
  classIds: string[];
  opensAt: string;
  closesAt: string;
  timeLimitMinutes?: number;
  negMarkEnabled?: boolean;
  negMarkPenalty?: number;
}

export interface QuestionFormInput {
  text: string;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
}
