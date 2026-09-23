import { useMe } from "../api/useMe";

export function useSession() {
  const { data, isLoading, isError } = useMe();

  return {
    isLoading,
    isAuthenticated: Boolean(data) && !isError,
    role: data?.role,
    name: data?.name,
  };
}
