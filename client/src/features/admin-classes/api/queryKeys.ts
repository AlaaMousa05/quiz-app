export const adminClassesKey = () => ["admin", "classes"] as const;
export const adminClassStudentsKey = (classId: string) => ["admin", "classes", classId, "students"] as const;
