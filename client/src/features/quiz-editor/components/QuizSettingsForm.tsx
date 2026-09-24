import { useState, type FormEvent } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Field } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import type { TeacherClass, QuizSettingsFormInput } from "../api/types";

export type QuizSettingsFormValues = QuizSettingsFormInput;

export function QuizSettingsForm({
  classes,
  initialValues,
  locked = false,
  onSubmit,
  isSubmitting,
  errorMessage,
  submitLabel,
}: {
  classes: TeacherClass[];
  initialValues?: Partial<QuizSettingsFormValues>;
  locked?: boolean;
  onSubmit: (values: QuizSettingsFormValues) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  submitLabel: string;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [classIds, setClassIds] = useState<string[]>(initialValues?.classIds ?? []);
  const [opensAt, setOpensAt] = useState(initialValues?.opensAt ?? "");
  const [closesAt, setClosesAt] = useState(initialValues?.closesAt ?? "");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialValues?.timeLimitMinutes ?? 20);
  const [negMarkEnabled, setNegMarkEnabled] = useState(initialValues?.negMarkEnabled ?? false);
  const [negMarkPenalty, setNegMarkPenalty] = useState(Math.round((initialValues?.negMarkPenalty ?? 0.25) * 100));

  function toggleClass(classId: string) {
    setClassIds((prev) => (prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      classIds,
      opensAt: new Date(opensAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      timeLimitMinutes,
      negMarkEnabled,
      negMarkPenalty: negMarkEnabled ? negMarkPenalty / 100 : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="auto">
      {locked && (
        <p className="rounded-md bg-warning-100 p-3 text-sm text-warning-700" dir="auto">
          {t("quizEditor.settings.lockedBanner")}
        </p>
      )}

      <Field
        label={t("quizEditor.settings.titleLabel")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={locked}
        required
      />

      <fieldset className="flex flex-col gap-2">
        <legend dir="auto">{t("quizEditor.settings.classesLabel")}</legend>
        <div className="flex flex-wrap gap-3">
          {classes.map((c) => (
            <label key={c.id} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={classIds.includes(c.id)}
                onChange={() => toggleClass(c.id)}
                disabled={locked}
              />
              <span dir="auto">{c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field
          type="datetime-local"
          label={t("quizEditor.settings.opensLabel")}
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
          required
        />
        <Field
          type="datetime-local"
          label={t("quizEditor.settings.closesLabel")}
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          required
        />
      </div>

      <Field
        type="number"
        min={1}
        label={t("quizEditor.settings.timeLimitLabel")}
        value={timeLimitMinutes}
        onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
        disabled={locked}
      />

      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={negMarkEnabled}
          onChange={(e) => setNegMarkEnabled(e.target.checked)}
          disabled={locked}
        />
        <span dir="auto">{t("quizEditor.settings.negMarkLabel")}</span>
      </label>
      {negMarkEnabled && (
        <Field
          type="number"
          min={0}
          max={100}
          label={t("quizEditor.settings.negMarkPenaltyLabel")}
          value={negMarkPenalty}
          onChange={(e) => setNegMarkPenalty(Number(e.target.value))}
          disabled={locked}
        />
      )}

      {errorMessage && (
        <p role="alert" className="text-sm text-danger-700" dir="auto">
          {errorMessage}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
