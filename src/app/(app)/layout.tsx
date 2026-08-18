import { AppShell } from "@/components/AppShell";
import { requireSession } from "@/lib/session";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();

  return <AppShell session={session}>{children}</AppShell>;
}
