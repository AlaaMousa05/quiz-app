import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useSession } from "../../features/auth/hooks/useSession";
import { useLogout } from "../../features/auth/api/useLogout";
import { NAV_LINKS } from "../../routes/navLinks";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "./Button";

// The shared page frame for every authenticated screen: brand bar + role-based
// nav + logout, so navigating between features is always one click away
// instead of relying on browser back or bookmarked URLs. `title`, when given,
// renders as the page's h1; pages that already have their own heading in
// `children` (most editor/detail screens) omit it to avoid a duplicate.
export function AppShell({ title, children }: { title?: string; children?: ReactNode }) {
  const { t } = useTranslation();
  const { role } = useSession();
  const logout = useLogout();
  const links = role ? NAV_LINKS[role] : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-bold text-accent-700" dir="auto">
            {t("app.title")}
          </span>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button onClick={() => logout.mutate()} disabled={logout.isPending}>
              {t("nav.logout")}
            </Button>
          </div>
        </div>
        {links.length > 0 && (
          <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2" aria-label={t("app.title")}>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-accent-100 text-accent-700" : "text-neutral-700 hover:bg-neutral-100"
                  }`
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4">
        {title && (
          <h1 className="text-2xl font-semibold" dir="auto">
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
}
