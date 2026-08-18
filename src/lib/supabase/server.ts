import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export async function createClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot always write cookies.
          // Middleware refreshes the session for us.
        }
      }
    }
  });
}
