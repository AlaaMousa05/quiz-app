export interface AdminClass {
  id: string;
  name: string;
  status: "ACTIVE" | "ARCHIVED";
  studentCount: number;
  quizCount: number;
}

export interface ClassStudent {
  id: string;
  name: string;
  username: string;
}
