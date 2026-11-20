// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAuthPublishableKey, supabaseAuthUrl } from "@/lib/supabase/auth-config";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // Forward provider callbacks while allowing the login page to display its own errors.
  const hasCode = url.searchParams.has("code");
  const hasError =
    url.searchParams.has("error_description") ||
    (pathname === "/" && url.searchParams.has("error"));

  if (pathname !== "/auth/callback" && (hasCode || hasError)) {
    const next = url.searchParams.get("next") || "/dashboard";
    const callbackUrl = new URL("/auth/callback", url.origin);

    // preserve auth params
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (code) callbackUrl.searchParams.set("code", code);
    if (error) callbackUrl.searchParams.set("error", error);
    if (errorDescription) {
      callbackUrl.searchParams.set("error_description", errorDescription);
    }

    callbackUrl.searchParams.set("next", next);

    return NextResponse.redirect(callbackUrl);
  }

  // 2) Only protect /dashboard and /api/scans/*
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/scans");

  if (!isProtected) {
    // public routes just continue
    return NextResponse.next();
  }

  const cookieName = `sb-${new URL(supabaseAuthUrl).hostname.split(".")[0]}-auth-token`;
  const hadSession = req.cookies.getAll().some(({ name }) =>
    name === cookieName || name.startsWith(`${cookieName}.`),
  );
  const signIn = () => {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    if (hadSession) {
      loginUrl.searchParams.set("error", "Your session could not be verified. Please sign in again.");
    }
    return NextResponse.redirect(loginUrl);
  };

  const res = NextResponse.next();

  const supabase = createServerClient(supabaseAuthUrl, supabaseAuthPublishableKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not logged in → send to /login with ?next=
    if (!user) return signIn();

    // Logged in → allow dashboard/api
    return res;
  } catch (err) {
    console.error("middleware auth error", err);
    return signIn();
  }
}

// 3) Match everything except static assets, so we can catch "/?code=..."
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
