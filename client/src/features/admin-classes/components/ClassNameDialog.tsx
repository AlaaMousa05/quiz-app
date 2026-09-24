import { useState, type FormEvent } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Dialog } from "../../../components/ui/Dialog";
import { Field } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";

export interface ClassNameDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValue?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

// Shared by A2's "+ New Class" and A3's "Rename" — the same name-only form,
// just pre-filled and re-purposed. Pass a `key` prop when reusing across
// different classes so the initialValue re-seeds on reopen.
export function ClassNameDialog({
  open,
  onClose,
  title,
  initialValue = "",
  submitLabel,
  onSubmit,
  isSubmitting,
  errorMessage,
}: ClassNameDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(name);
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="auto">
        <Field label={t("admin.classes.nameLabel")} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        {errorMessage && (
          <p role="alert" className="text-sm text-danger-700" dir="auto">
            {errorMessage}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Dialog>
  );
}
