import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { ME_QUERY_KEY } from "./useMe";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<void>("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(ME_QUERY_KEY, undefined);
    },
  });
}
