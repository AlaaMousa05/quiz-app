import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { MyQuizzesPage } from "../features/student-quiz/pages/MyQuizzesPage";
import { QuizIntroPage } from "../features/student-quiz/pages/QuizIntroPage";
import { TakingQuizPage } from "../features/student-quiz/pages/TakingQuizPage";
import { ResultPage } from "../features/student-quiz/pages/ResultPage";
import { ReviewPage } from "../features/student-quiz/pages/ReviewPage";
import { TeacherHomePage } from "../features/quiz-editor/pages/TeacherHomePage";
import { AdminHomePage } from "../features/admin-classes/pages/AdminHomePage";
import { RoleGuard } from "./RoleGuard";
import { ROLE_HOME_PATH } from "./roleHome";

function studentRoute(element: ReactNode) {
  return <RoleGuard allow={["STUDENT"]}>{element}</RoleGuard>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/quizzes", element: studentRoute(<MyQuizzesPage />) },
  { path: "/quizzes/:quizId", element: studentRoute(<QuizIntroPage />) },
  { path: "/quizzes/:quizId/attempt", element: studentRoute(<TakingQuizPage />) },
  { path: "/quizzes/:quizId/result", element: studentRoute(<ResultPage />) },
  { path: "/quizzes/:quizId/review", element: studentRoute(<ReviewPage />) },
  {
    path: ROLE_HOME_PATH.TEACHER,
    element: (
      <RoleGuard allow={["TEACHER"]}>
        <TeacherHomePage />
      </RoleGuard>
    ),
  },
  {
    path: ROLE_HOME_PATH.ADMIN,
    element: (
      <RoleGuard allow={["ADMIN"]}>
        <AdminHomePage />
      </RoleGuard>
    ),
  },
]);
