import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { ME_QUERY_KEY } from "./useMe";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post<void>("/auth/logout"),
    onSuccess: () => {
      // Remove the cached session so the route guards immediately treat the
      // user as unauthenticated. setQueryData(key, undefined) is unreliable
      // in React Query v5 (undefined can be ignored), so remove the entry and
      // drop every other cached query too, to avoid leaking the previous
      // user's data into the next session.
      queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
      queryClient.clear();
    },
  });
}
