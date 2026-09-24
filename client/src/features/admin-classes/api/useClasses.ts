import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../lib/apiClient";
import { adminClassesKey } from "./queryKeys";
import type { AdminClass } from "./types";

export function useClasses() {
  return useQuery({ queryKey: adminClassesKey(), queryFn: () => apiClient.get<AdminClass[]>("/admin/classes") });
}
