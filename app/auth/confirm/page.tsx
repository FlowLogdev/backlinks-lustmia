import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = {
  title: "Confirm your email",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; next?: string }>;
}) {
  const { token_hash: tokenHash, next } = await searchParams;

  return (
    <AuthShell
      eyebrow="Account verification"
      title="Confirm your email"
      description={
        tokenHash
          ? "Confirm your email to finish setting up your RankCore account."
          : "This confirmation link is missing its verification code."
      }
      footer={<Link href="/login" className="text-sm font-semibold underline">Go to sign in</Link>}
    >
      {tokenHash && (
        <form action="/auth/confirm/verify" method="post">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="next" value={next === "/pricing" ? "/pricing" : "/dashboard"} />
          <button className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            Confirm email
          </button>
        </form>
      )}
    </AuthShell>
  );
}
