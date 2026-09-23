import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoginInput } from "shared";
import { apiClient } from "../../../lib/apiClient";
import { ME_QUERY_KEY, type Me } from "./useMe";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.post<Me>("/auth/login", input),
    onSuccess: (me) => {
      // Login already returns the full session shape, so hydrate the cache
      // directly instead of an extra GET /auth/me round trip.
      queryClient.setQueryData(ME_QUERY_KEY, me);
    },
  });
}
