import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClassUpdateInput } from "shared";
import { apiClient } from "../../../lib/apiClient";
import { adminClassesKey, adminClassStudentsKey } from "./queryKeys";

function useInvalidateClasses() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: adminClassesKey() });
}

export function useCreateClass() {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: (name: string) => apiClient.post<{ classId: string }>("/admin/classes", { name }),
    onSuccess: invalidate,
  });
}

export function useUpdateClass(classId: string) {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: (input: ClassUpdateInput) => apiClient.patch(`/admin/classes/${classId}`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteClass() {
  const invalidate = useInvalidateClasses();
  return useMutation({
    mutationFn: (classId: string) => apiClient.delete(`/admin/classes/${classId}`),
    onSuccess: invalidate,
  });
}

export function useMoveStudent(classId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, toClassId }: { studentId: string; toClassId: string }) =>
      apiClient.post(`/admin/classes/${classId}/students/${studentId}/move`, { toClassId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminClassStudentsKey(classId) });
      void queryClient.invalidateQueries({ queryKey: adminClassesKey() });
    },
  });
}
