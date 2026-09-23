import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "shared";
import { useSession } from "../features/auth/hooks/useSession";
import { useTranslation } from "../lib/i18n/useTranslation";
import { CenteredMessage } from "../components/ui/CenteredMessage";

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { isLoading, isAuthenticated, role } = useSession();
  const { t } = useTranslation();

  if (isLoading) {
    return <CenteredMessage>{t("common.loading")}</CenteredMessage>;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <CenteredMessage>{t("error.forbidden")}</CenteredMessage>;
  }

  return <>{children}</>;
}
