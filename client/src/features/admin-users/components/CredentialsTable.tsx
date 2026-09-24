import { Table } from "../../../components/ui/Table";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { CreatedAccount } from "../api/types";

export function CredentialsTable({ accounts }: { accounts: CreatedAccount[] }) {
  const { t } = useTranslation();
  return (
    <Table
      columns={[
        { key: "name", header: t("admin.users.nameLabel"), render: (a: CreatedAccount) => a.name },
        { key: "username", header: t("admin.users.usernameLabel"), render: (a: CreatedAccount) => a.username },
        { key: "password", header: t("admin.users.passwordLabel"), render: (a: CreatedAccount) => a.temporaryPassword },
      ]}
      rows={accounts}
      rowKey={(a) => a.userId}
    />
  );
}
