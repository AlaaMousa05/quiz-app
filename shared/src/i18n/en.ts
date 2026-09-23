export const en = {
  "app.title": "Quiz App",
  "app.tagline": "Nour's Tutoring Centre",

  "nav.logout": "Log out",

  "login.title": "Log in",
  "login.usernameLabel": "Username",
  "login.passwordLabel": "Password",
  "login.submit": "Log in",
  "login.submitting": "Logging in…",

  "auth.invalidCredentials": "Incorrect username or password.",
  "auth.deactivated": "This account has been deactivated.",

  "error.unauthorized": "Please log in to continue.",
  "error.forbidden": "You don't have access to this page.",
  "error.notFound": "We couldn't find that.",
  "error.validation": "Please check what you entered and try again.",
  "error.conflict": "That can't be done right now.",
  "error.deadlinePassed": "The deadline for this has passed.",
  "error.generic": "Something went wrong. Please try again.",

  "role.student.home": "Student home",
  "role.teacher.home": "Teacher home",
  "role.admin.home": "Admin home",

  "language.toggle": "العربية",
  "common.loading": "Loading…",
} as const;

export type TranslationKey = keyof typeof en;
