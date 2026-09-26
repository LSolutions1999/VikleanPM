import { AppShell } from "@/components/AppShell";
import { requireSession } from "@/lib/session";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSession();

  return <AppShell>{children}</AppShell>;
}
