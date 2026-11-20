// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAuthPublishableKey, supabaseAuthUrl } from "./auth-config";

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseAuthUrl,
    supabaseAuthPublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. Proxy refreshes sessions.
          }
        },
      },
    }
  );
}
