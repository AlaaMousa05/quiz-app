import { useState } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { Button } from "../../../components/ui/Button";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useClasses } from "../api/useClasses";
import { useCreateClass } from "../api/useClassMutations";
import { ClassCard } from "../components/ClassCard";
import { ClassNameDialog } from "../components/ClassNameDialog";

export function ClassesPage() {
  const { t } = useTranslation();
  const { data: classes, isLoading, isError } = useClasses();
  const createClass = useCreateClass();
  const [dialogOpen, setDialogOpen] = useState(false);

  const gate = queryGateMessage(t, isLoading, isError, "admin.classes.loadError");

  function handleCreate(name: string) {
    createClass.mutate(name, { onSuccess: () => setDialogOpen(false) });
  }

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold" dir="auto">
            {t("admin.classes.title")}
          </h2>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            {t("admin.classes.newClass")}
          </Button>
        </div>
        {gate}
        {!gate && classes && (
          <div className="flex flex-col gap-3">
            {classes.map((klass) => (
              <ClassCard key={klass.id} klass={klass} />
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-neutral-500" dir="auto">
                {t("admin.classes.empty")}
              </p>
            )}
          </div>
        )}
      </div>

      <ClassNameDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t("admin.classes.newClass")}
        submitLabel={t("admin.classes.create")}
        onSubmit={handleCreate}
        isSubmitting={createClass.isPending}
        errorMessage={createClass.isError ? t("admin.classes.createError") : undefined}
      />
    </RoleHomeShell>
  );
}
