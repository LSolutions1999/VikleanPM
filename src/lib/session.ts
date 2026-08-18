import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staff } from "@/lib/mock-data";
import type { SessionContext, UserRole } from "@/lib/types";

function normalizeRole(value: unknown): UserRole {
  if (value === "admin" || value === "manager" || value === "maintenance") {
    return value;
  }

  return "manager";
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return null;
  }

  const metadataRole = normalizeRole(
    user.user_metadata?.role ?? user.app_metadata?.role ?? user.user_metadata?.access_role
  );

  const profile = staff.find((member) => member.email === user.email);
  const name = profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "Team member";
  const email = user.email ?? profile?.email ?? "unknown@example.com";

  return {
    name,
    email,
    role: profile?.role ?? metadataRole
  };
}

export async function requireSession() {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  return session;
}
