import { useState, type FormEvent } from "react";
import type { Role } from "shared";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Dialog } from "../../../components/ui/Dialog";
import { Field } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import type { AdminClass } from "../../admin-classes/api/types";

export interface NewUserFormValues {
  name: string;
  role: Extract<Role, "TEACHER" | "STUDENT">;
  classId?: string;
}

export function NewUserDialog({
  open,
  onClose,
  classes,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  classes: AdminClass[];
  onSubmit: (values: NewUserFormValues) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [role, setRole] = useState<NewUserFormValues["role"]>("STUDENT");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, role, classId: role === "STUDENT" ? classId : undefined });
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("admin.users.newUser")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="auto">
        <Field label={t("admin.users.nameLabel")} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700" dir="auto">
            {t("admin.users.roleLabel")}
          </span>
          <select
            className="min-h-11 rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-100"
            value={role}
            onChange={(e) => setRole(e.target.value as NewUserFormValues["role"])}
          >
            <option value="STUDENT">{t("admin.users.role.student")}</option>
            <option value="TEACHER">{t("admin.users.role.teacher")}</option>
          </select>
        </label>

        {role === "STUDENT" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-neutral-700" dir="auto">
              {t("admin.users.classLabel")}
            </span>
            <select
              className="min-h-11 rounded-md border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-accent-600 focus:ring-2 focus:ring-accent-100"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {errorMessage && (
          <p role="alert" className="text-sm text-danger-700" dir="auto">
            {errorMessage}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {t("admin.users.create")}
        </Button>
      </form>
    </Dialog>
  );
}
