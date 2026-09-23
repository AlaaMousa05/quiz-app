export const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

export type Role = (typeof ROLES)[number];
