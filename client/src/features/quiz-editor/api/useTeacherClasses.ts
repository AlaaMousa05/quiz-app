import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { teacherClassesKey } from "./queryKeys";
import type { TeacherClass } from "./types";

export function useTeacherClasses() {
  return useQuery({
    queryKey: teacherClassesKey(),
    queryFn: () => apiClient.get<TeacherClass[]>("/teacher/classes"),
  });
}
