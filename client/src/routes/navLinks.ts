import type { Role, TranslationKey } from "shared";

export interface NavLink {
  to: string;
  labelKey: TranslationKey;
  end?: boolean;
}

export const NAV_LINKS: Record<Role, NavLink[]> = {
  STUDENT: [{ to: "/quizzes", labelKey: "studentQuiz.myQuizzes", end: true }],
  TEACHER: [{ to: "/teacher", labelKey: "quizEditor.myQuizzes", end: true }],
  ADMIN: [
    { to: "/admin", labelKey: "role.admin.home", end: true },
    { to: "/admin/classes", labelKey: "admin.classes.title" },
    { to: "/admin/users", labelKey: "admin.users.title" },
    { to: "/admin/quizzes", labelKey: "admin.allQuizzes" },
    { to: "/admin/results", labelKey: "admin.allResults" },
  ],
};
