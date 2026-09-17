// lib/supabase/browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// IMPORTANT: use createBrowserClient (PKCE + cookies), NOT createClient
export const supabaseBrowserClient = createBrowserClient(
  // Client modules are evaluated during Next's production build, where runtime
  // environment variables are intentionally unavailable. Vercel replaces these
  // values in the production browser bundle. These are the public project
  // coordinates used only as a build-time fallback, so auth cannot silently
  // target a non-existent placeholder when a deployment is built without them.
  supabaseUrl || "https://gaoundygwhttdfqukmdc.supabase.co",
  supabaseAnonKey || "sb_publishable_m34lU0o3vaHmdqwl1TAJbQ_WWz5Sr4s"
);
