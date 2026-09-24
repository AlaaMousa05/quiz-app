import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { AppShell } from "../../../components/ui/AppShell";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { LinkButton } from "../../../components/ui/LinkButton";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useToast } from "../../../components/ui/Toast";
import { errorMessage } from "../../../lib/errorMessage";
import { useClasses } from "../api/useClasses";
import { useClassStudents } from "../api/useClassStudents";
import { useUpdateClass, useDeleteClass, useMoveStudent } from "../api/useClassMutations";
import { ClassNameDialog } from "../components/ClassNameDialog";
import { StudentRow } from "../components/StudentRow";

export function ClassDetailPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { classId = "" } = useParams();
  const classesQuery = useClasses();
  const studentsQuery = useClassStudents(classId);
  const updateClass = useUpdateClass(classId);
  const deleteClass = useDeleteClass();
  const moveStudent = useMoveStudent(classId);
  const [renaming, setRenaming] = useState(false);

  const gate = queryGateMessage(
    t,
    classesQuery.isLoading || studentsQuery.isLoading,
    classesQuery.isError || studentsQuery.isError,
    "admin.classDetail.loadError",
  );
  const klass = classesQuery.data?.find((c) => c.id === classId);
  const otherClasses = (classesQuery.data ?? []).filter((c) => c.id !== classId && c.status === "ACTIVE");

  if (gate || !klass) {
    return <AppShell>{gate ?? <CenteredMessage>{t("admin.classDetail.loadError")}</CenteredMessage>}</AppShell>;
  }

  const canDelete = klass.studentCount === 0 && klass.quizCount === 0;

  // klass is guaranteed defined here (the `if (gate || !klass) return` above
  // already handled the undefined case) — TS just can't see that narrowing
  // through these nested function declarations.
  function handleArchiveToggle() {
    const goingArchived = klass!.status === "ACTIVE";
    updateClass.mutate(
      { status: goingArchived ? "ARCHIVED" : "ACTIVE" },
      {
        onSuccess: () => toast.show(t("toast.done")),
        onError: (err) => toast.show(errorMessage(t, err), "error"),
      },
    );
  }

  function handleDelete() {
    deleteClass.mutate(klass!.id, {
      onError: (err) => toast.show(errorMessage(t, err), "error"),
    });
  }

  function handleMove(studentId: string, toClassId: string) {
    moveStudent.mutate(
      { studentId, toClassId },
      {
        onSuccess: () => toast.show(t("toast.done")),
        onError: (err) => toast.show(errorMessage(t, err), "error"),
      },
    );
  }

  return (
    <AppShell>
      <LinkButton to="/admin/classes">← {t("common.back")}</LinkButton>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-semibold" dir="auto">
          {klass.name}
          {klass.status === "ARCHIVED" && <Badge>{t("admin.classes.archived")}</Badge>}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setRenaming(true)}>{t("admin.classDetail.rename")}</Button>
          <Button disabled={updateClass.isPending} onClick={handleArchiveToggle}>
            {t(klass.status === "ACTIVE" ? "admin.classDetail.archive" : "admin.classDetail.restore")}
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || deleteClass.isPending}
            title={canDelete ? undefined : t("admin.classDetail.deleteDisabledHint")}
            onClick={handleDelete}
          >
            {t("admin.classDetail.delete")}
          </Button>
        </div>
      </div>

      {klass.status === "ARCHIVED" && (
        <p className="rounded-md bg-warning-100 p-3 text-sm text-warning-700" dir="auto">
          {t("admin.classDetail.archivedBanner")}
        </p>
      )}

      <p className="text-sm text-neutral-500" dir="auto">
        {t("admin.classes.studentsCount", { count: klass.studentCount })}
      </p>

      <div className="flex flex-col gap-2">
        {(studentsQuery.data ?? []).map((student) => (
          <StudentRow
            key={student.id}
            student={student}
            otherClasses={otherClasses}
            onMove={(toClassId) => handleMove(student.id, toClassId)}
            isMoving={moveStudent.isPending && moveStudent.variables?.studentId === student.id}
          />
        ))}
        {studentsQuery.data?.length === 0 && (
          <p className="text-sm text-neutral-500" dir="auto">
            {t("admin.classDetail.empty")}
          </p>
        )}
      </div>

      <ClassNameDialog
        key={klass.id}
        open={renaming}
        onClose={() => setRenaming(false)}
        title={t("admin.classDetail.rename")}
        initialValue={klass.name}
        submitLabel={t("admin.classes.save")}
        onSubmit={(name) =>
          updateClass.mutate(
            { name },
            {
              onSuccess: () => {
                setRenaming(false);
                toast.show(t("toast.updated"));
              },
            },
          )
        }
        isSubmitting={updateClass.isPending}
        errorMessage={updateClass.isError ? errorMessage(t, updateClass.error) : undefined}
      />
    </AppShell>
  );
}
