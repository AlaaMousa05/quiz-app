import { useNavigate } from "react-router-dom";
import type { TranslationKey } from "shared";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { ApiError } from "../../../lib/apiClient";
import { LanguageToggle } from "../../../components/ui/LanguageToggle";
import { ROLE_HOME_PATH } from "../../../routes/roleHome";
import { useLogin } from "../api/useLogin";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();

  function handleSubmit(username: string, password: string) {
    login.mutate(
      { username, password },
      { onSuccess: (me) => navigate(ROLE_HOME_PATH[me.role], { replace: true }) },
    );
  }

  const errorMessage =
    login.error instanceof ApiError ? t((login.error.messageKey ?? "error.generic") as TranslationKey) : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <div className="self-end">
        <LanguageToggle />
      </div>
      <LoginForm onSubmit={handleSubmit} isSubmitting={login.isPending} errorMessage={errorMessage} />
    </main>
  );
}
