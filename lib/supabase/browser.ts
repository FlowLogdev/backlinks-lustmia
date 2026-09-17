// lib/supabase/browser.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser credentials are intentionally public. Keeping the active project
// coordinates here prevents Vercel's stale build-time public environment values
// from sending browser authentication to a retired Supabase project.
const supabaseUrl = "https://gaoundygwhttdfqukmdc.supabase.co";
const supabaseAnonKey = "sb_publishable_m34lU0o3vaHmdqwl1TAJbQ_WWz5Sr4s";

// IMPORTANT: use createBrowserClient (PKCE + cookies), NOT createClient
export const supabaseBrowserClient = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);
