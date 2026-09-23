import { useState, type FormEvent } from "react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { Field } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";

export interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function LoginForm({ onSubmit, isSubmitting, errorMessage }: LoginFormProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(username, password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4" dir="auto">
      <h1 className="text-xl font-semibold" dir="auto">
        {t("login.title")}
      </h1>

      <Field
        label={t("login.usernameLabel")}
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        required
      />

      <Field
        label={t("login.passwordLabel")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600" dir="auto">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? t("login.submitting") : t("login.submit")}
      </Button>
    </form>
  );
}
