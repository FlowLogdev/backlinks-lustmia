import type { User } from "@supabase/supabase-js";

type Account = Pick<User, "email" | "email_confirmed_at">;

const ADMIN_EMAILS = new Set([
  "sales@lustmia.com",
  "support@flowlog.dev",
  "support@rankcore.ai",
]);

export function isRankCoreAdmin(account: Account | null | undefined) {
  return Boolean(
    account?.email_confirmed_at &&
      ADMIN_EMAILS.has(account.email?.trim().toLowerCase() ?? ""),
  );
}

export function hasRankCoreInternalAccess(account: Account | null | undefined) {
  return (
    isRankCoreAdmin(account) ||
    account?.email?.toLowerCase() === "sales@lustmia.com.br"
  );
}
