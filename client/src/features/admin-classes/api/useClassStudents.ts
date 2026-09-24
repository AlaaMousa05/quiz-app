import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { adminClassStudentsKey } from "./queryKeys";
import type { ClassStudent } from "./types";

export function useClassStudents(classId: string) {
  return useQuery({
    queryKey: adminClassStudentsKey(classId),
    queryFn: () => apiClient.get<ClassStudent[]>(`/admin/classes/${classId}/students`),
  });
}
