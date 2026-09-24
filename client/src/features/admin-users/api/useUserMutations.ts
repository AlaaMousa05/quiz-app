import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserCreateInput } from "shared";
import { apiClient } from "../../../lib/apiClient";
import { adminUsersKey } from "./queryKeys";

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: adminUsersKey() });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: UserCreateInput) =>
      apiClient.post<{ userId: string; username: string; temporaryPassword: string }>("/admin/users", input),
    onSuccess: invalidate,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: string) => apiClient.post<{ temporaryPassword: string }>(`/admin/users/${userId}/reset-password`),
  });
}

export function useDeactivateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: string) => apiClient.post(`/admin/users/${userId}/deactivate`),
    onSuccess: invalidate,
  });
}

export function useReactivateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (userId: string) => apiClient.post(`/admin/users/${userId}/reactivate`),
    onSuccess: invalidate,
  });
}
