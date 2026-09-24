import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { adminUsersKey } from "./queryKeys";
import type { AdminUser } from "./types";

export function useUsers() {
  return useQuery({ queryKey: adminUsersKey(), queryFn: () => apiClient.get<AdminUser[]>("/admin/users") });
}
