// lib/supabase/browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// IMPORTANT: use createBrowserClient (PKCE + cookies), NOT createClient
export const supabaseBrowserClient = createBrowserClient(
  // Client modules are evaluated during Next's production build, where runtime
  // environment variables are intentionally unavailable. Vercel replaces these
  // values in the production browser bundle; placeholders keep build-time
  // evaluation from preventing a valid release.
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
