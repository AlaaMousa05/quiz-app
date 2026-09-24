import type { Role, TranslationKey } from "shared";

export const ROLE_HOME_PATH: Record<Role, string> = {
  STUDENT: "/quizzes",
  TEACHER: "/teacher",
  ADMIN: "/admin",
};

export const ROLE_HOME_TITLE_KEY: Record<Role, TranslationKey> = {
  STUDENT: "role.student.home",
  TEACHER: "role.teacher.home",
  ADMIN: "role.admin.home",
};
