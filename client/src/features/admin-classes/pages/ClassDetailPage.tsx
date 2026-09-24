import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { RoleHomeShell } from "../../../components/ui/RoleHomeShell";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { LinkButton } from "../../../components/ui/LinkButton";
import { CenteredMessage } from "../../../components/ui/CenteredMessage";
import { queryGateMessage } from "../../../components/ui/queryGateMessage";
import { useClasses } from "../api/useClasses";
import { useClassStudents } from "../api/useClassStudents";
import { useUpdateClass, useDeleteClass, useMoveStudent } from "../api/useClassMutations";
import { ClassNameDialog } from "../components/ClassNameDialog";
import { StudentRow } from "../components/StudentRow";

export function ClassDetailPage() {
  const { t } = useTranslation();
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
    return <RoleHomeShell titleKey="app.title">{gate ?? <CenteredMessage>{t("admin.classDetail.loadError")}</CenteredMessage>}</RoleHomeShell>;
  }

  const canDelete = klass.studentCount === 0 && klass.quizCount === 0;

  return (
    <RoleHomeShell titleKey="app.title">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <LinkButton to="/admin/classes">{t("common.back")}</LinkButton>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-2xl font-semibold" dir="auto">
            {klass.name}
            {klass.status === "ARCHIVED" && <Badge>{t("admin.classes.archived")}</Badge>}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRenaming(true)}>{t("admin.classDetail.rename")}</Button>
            {klass.status === "ACTIVE" ? (
              <Button onClick={() => updateClass.mutate({ status: "ARCHIVED" })}>{t("admin.classDetail.archive")}</Button>
            ) : (
              <Button onClick={() => updateClass.mutate({ status: "ACTIVE" })}>{t("admin.classDetail.restore")}</Button>
            )}
            <Button
              variant="destructive"
              disabled={!canDelete}
              title={canDelete ? undefined : t("admin.classDetail.deleteDisabledHint")}
              onClick={() => deleteClass.mutate(klass.id)}
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
              onMove={(toClassId) => moveStudent.mutate({ studentId: student.id, toClassId })}
              isMoving={moveStudent.isPending && moveStudent.variables?.studentId === student.id}
            />
          ))}
          {studentsQuery.data?.length === 0 && (
            <p className="text-sm text-neutral-500" dir="auto">
              {t("admin.classDetail.empty")}
            </p>
          )}
        </div>
      </div>

      <ClassNameDialog
        key={klass.id}
        open={renaming}
        onClose={() => setRenaming(false)}
        title={t("admin.classDetail.rename")}
        initialValue={klass.name}
        submitLabel={t("admin.classes.save")}
        onSubmit={(name) => updateClass.mutate({ name }, { onSuccess: () => setRenaming(false) })}
        isSubmitting={updateClass.isPending}
      />
    </RoleHomeShell>
  );
}
