import { useState } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { useDeactivateUser, useReactivateUser, useResetPassword } from "../api/useUserMutations";
import type { AdminUser } from "../api/types";

export function UserRow({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
  const resetPassword = useResetPassword();
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();
  const [newPassword, setNewPassword] = useState<string | null>(null);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="flex items-center gap-2" dir="auto">
            {user.name}
            {user.status === "DEACTIVATED" && <Badge>{t("admin.users.deactivated")}</Badge>}
          </p>
          <p className="text-sm text-neutral-500">
            {user.username} · {t(`admin.users.role.${user.role.toLowerCase() as "student" | "teacher" | "admin"}`)}
            {user.className ? ` · ${user.className}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => resetPassword.mutate(user.id, { onSuccess: (r) => setNewPassword(r.temporaryPassword) })}>
            {t("admin.users.resetPassword")}
          </Button>
          {user.status === "ACTIVE" ? (
            <Button variant="destructive" onClick={() => deactivate.mutate(user.id)}>
              {t("admin.users.deactivate")}
            </Button>
          ) : (
            <Button onClick={() => reactivate.mutate(user.id)}>{t("admin.users.reactivate")}</Button>
          )}
        </div>
      </div>
      {newPassword && (
        <p className="rounded-md bg-success-100 p-2 text-sm text-success-700" dir="auto">
          {t("admin.users.newPassword", { password: newPassword })}
        </p>
      )}
    </Card>
  );
}
