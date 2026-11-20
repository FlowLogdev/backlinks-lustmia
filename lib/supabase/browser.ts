"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAuthPublishableKey, supabaseAuthUrl } from "./auth-config";

export const supabaseBrowserClient = createBrowserClient(
  supabaseAuthUrl,
  supabaseAuthPublishableKey,
);
