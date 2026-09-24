export type StudentStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "AUTO_FINALIZED";

export interface StudentResult {
  studentId: string;
  name: string;
  status: StudentStatus;
  score?: number;
}

export interface ResultsResponse {
  classAverage: number;
  maxPoints: number;
  perQuestionPctCorrect: Array<{ questionId: string; pctCorrect: number }>;
  students: StudentResult[];
}

export interface AdminQuizListItem {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  classNames: string[];
  attemptCount: number;
  enrolledCount: number;
  ownerName: string;
}
