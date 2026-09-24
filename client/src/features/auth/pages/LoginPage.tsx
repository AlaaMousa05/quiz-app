import { useNavigate } from "react-router-dom";
import type { TranslationKey } from "shared";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { ApiError } from "../../../lib/apiClient";
import { LanguageToggle } from "../../../components/ui/LanguageToggle";
import { Card } from "../../../components/ui/Card";
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
    <main className="flex min-h-screen flex-col bg-neutral-50">
      <div className="flex justify-end p-4">
        <LanguageToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-accent-700" dir="auto">
            {t("app.title")}
          </p>
          <p className="text-sm text-neutral-500" dir="auto">
            {t("app.tagline")}
          </p>
        </div>
        <Card className="w-full max-w-sm">
          <LoginForm onSubmit={handleSubmit} isSubmitting={login.isPending} errorMessage={errorMessage} />
        </Card>
      </div>
    </main>
  );
}
