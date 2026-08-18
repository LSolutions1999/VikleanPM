import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export const createClient = () => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createBrowserClient(supabaseUrl, supabaseKey);
};
