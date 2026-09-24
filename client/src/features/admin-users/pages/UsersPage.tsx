import { useState } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { Button } from "../../../components/ui/Button";
import { LinkButton } from "../../../components/ui/LinkButton";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useUsers } from "../api/useUsers";
import { useCreateUser } from "../api/useUserMutations";
import { useClasses } from "../../admin-classes/api/useClasses";
import { UserRow } from "../components/UserRow";
import { NewUserDialog, type NewUserFormValues } from "../components/NewUserDialog";

export function UsersPage() {
  const { t } = useTranslation();
  const usersQuery = useUsers();
  const classesQuery = useClasses();
  const createUser = useCreateUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const gate = queryGateMessage(t, usersQuery.isLoading, usersQuery.isError, "admin.users.loadError");

  function handleCreate(values: NewUserFormValues) {
    createUser.mutate(values, { onSuccess: () => setDialogOpen(false) });
  }

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold" dir="auto">
            {t("admin.users.title")}
          </h2>
          <div className="flex gap-2">
            <LinkButton to="/admin/users/import">{t("admin.users.import")}</LinkButton>
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              {t("admin.users.newUser")}
            </Button>
          </div>
        </div>
        {gate}
        {!gate && usersQuery.data && (
          <div className="flex flex-col gap-3">
            {usersQuery.data.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
            {usersQuery.data.length === 0 && (
              <p className="text-sm text-neutral-500" dir="auto">
                {t("admin.users.empty")}
              </p>
            )}
          </div>
        )}
      </div>

      <NewUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        classes={classesQuery.data ?? []}
        onSubmit={handleCreate}
        isSubmitting={createUser.isPending}
        errorMessage={createUser.isError ? t("admin.users.createError") : undefined}
      />
    </RoleHomeShell>
  );
}
