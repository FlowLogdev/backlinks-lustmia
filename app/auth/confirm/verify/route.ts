import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { origin } = req.nextUrl;
  const fetchSite = req.headers.get("sec-fetch-site");
  const formOrigin = req.headers.get("origin");

  if (
    (fetchSite !== null && fetchSite !== "same-origin") ||
    (formOrigin !== origin && !(fetchSite === "same-origin" && formOrigin === "null"))
  ) {
    return NextResponse.json({ error: "Invalid confirmation request" }, { status: 403 });
  }

  const form = await req.formData();
  const tokenHash = form.get("token_hash");
  const next = form.get("next") === "/pricing" ? "/pricing" : "/dashboard";
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set(
    "error",
    "This confirmation link is invalid or expired. If you already confirmed your email, sign in.",
  );

  if (typeof tokenHash !== "string" || !/^[A-Za-z0-9_-]{20,256}$/.test(tokenHash)) {
    return NextResponse.redirect(loginUrl, 303);
  }

  try {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });

    if (!error && data.session) {
      return NextResponse.redirect(new URL(next, origin), 303);
    }
  } catch {
    loginUrl.searchParams.set("error", "We could not confirm your email. Please try again.");
  }

  return NextResponse.redirect(loginUrl, 303);
}
