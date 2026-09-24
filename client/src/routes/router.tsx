import type { ReactNode } from "react";
import type { Role } from "shared";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { MyQuizzesPage as StudentMyQuizzesPage } from "../features/student-quiz/pages/MyQuizzesPage";
import { QuizIntroPage } from "../features/student-quiz/pages/QuizIntroPage";
import { TakingQuizPage } from "../features/student-quiz/pages/TakingQuizPage";
import { ResultPage } from "../features/student-quiz/pages/ResultPage";
import { ReviewPage } from "../features/student-quiz/pages/ReviewPage";
import { MyQuizzesPage as TeacherMyQuizzesPage } from "../features/quiz-editor/pages/MyQuizzesPage";
import { QuizSettingsPage } from "../features/quiz-editor/pages/QuizSettingsPage";
import { QuestionsEditorPage } from "../features/quiz-editor/pages/QuestionsEditorPage";
import { ImportQuizPage } from "../features/quiz-editor/pages/ImportQuizPage";
import { QuizResultsPage } from "../features/results/pages/QuizResultsPage";
import { AdminQuizzesPage } from "../features/results/pages/AdminQuizzesPage";
import { AdminResultsPage } from "../features/results/pages/AdminResultsPage";
import { AdminHomePage } from "../features/admin-classes/pages/AdminHomePage";
import { RoleGuard } from "./RoleGuard";
import { ROLE_HOME_PATH } from "./roleHome";

function roleRoute(role: Role, element: ReactNode) {
  return <RoleGuard allow={[role]}>{element}</RoleGuard>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },

  { path: "/quizzes", element: roleRoute("STUDENT", <StudentMyQuizzesPage />) },
  { path: "/quizzes/:quizId", element: roleRoute("STUDENT", <QuizIntroPage />) },
  { path: "/quizzes/:quizId/attempt", element: roleRoute("STUDENT", <TakingQuizPage />) },
  { path: "/quizzes/:quizId/result", element: roleRoute("STUDENT", <ResultPage />) },
  { path: "/quizzes/:quizId/review", element: roleRoute("STUDENT", <ReviewPage />) },

  { path: ROLE_HOME_PATH.TEACHER, element: roleRoute("TEACHER", <TeacherMyQuizzesPage />) },
  { path: "/teacher/quizzes/new", element: roleRoute("TEACHER", <QuizSettingsPage />) },
  { path: "/teacher/quizzes/import", element: roleRoute("TEACHER", <ImportQuizPage />) },
  { path: "/teacher/quizzes/:quizId/settings", element: roleRoute("TEACHER", <QuizSettingsPage />) },
  { path: "/teacher/quizzes/:quizId/questions", element: roleRoute("TEACHER", <QuestionsEditorPage />) },
  { path: "/teacher/quizzes/:quizId/results", element: roleRoute("TEACHER", <QuizResultsPage scope="teacher" />) },

  { path: ROLE_HOME_PATH.ADMIN, element: roleRoute("ADMIN", <AdminHomePage />) },
  { path: "/admin/quizzes", element: roleRoute("ADMIN", <AdminQuizzesPage />) },
  { path: "/admin/results", element: roleRoute("ADMIN", <AdminResultsPage />) },
  { path: "/admin/quizzes/:quizId/results", element: roleRoute("ADMIN", <QuizResultsPage scope="admin" />) },
]);
