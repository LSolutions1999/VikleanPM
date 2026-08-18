import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "./src/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = (() => {
    try {
      return getSupabaseEnv();
    } catch {
      return { supabaseUrl: "", supabaseKey: "" };
    }
  })();

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
