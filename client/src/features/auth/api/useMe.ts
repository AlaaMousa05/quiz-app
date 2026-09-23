import { useQuery } from "@tanstack/react-query";
import type { Role } from "shared";
import { apiClient, ApiError } from "../../../lib/apiClient";

export interface Me {
  role: Role;
  name: string;
  username: string;
}

export const ME_QUERY_KEY = ["auth", "me"] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => apiClient.get<Me>("/auth/me"),
    retry: false,
    staleTime: 60_000,
    throwOnError: (error) => !(error instanceof ApiError && error.status === 401),
  });
}
