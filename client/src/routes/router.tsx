import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { StudentHomePage } from "../features/student-quiz/pages/StudentHomePage";
import { TeacherHomePage } from "../features/quiz-editor/pages/TeacherHomePage";
import { AdminHomePage } from "../features/admin-classes/pages/AdminHomePage";
import { RoleGuard } from "./RoleGuard";
import { ROLE_HOME_PATH } from "./roleHome";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  {
    path: ROLE_HOME_PATH.STUDENT,
    element: (
      <RoleGuard allow={["STUDENT"]}>
        <StudentHomePage />
      </RoleGuard>
    ),
  },
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
