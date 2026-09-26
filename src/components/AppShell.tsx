import Link from "next/link";
import { Building2, ClipboardList, LogOut, UserCircle2 } from "lucide-react";
import { signOutAction } from "@/app/actions";
import type { SessionContext } from "@/lib/types";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/properties", label: "Properties", icon: <Building2 size={18} /> },
  { href: "/tasks", label: "Tasks", icon: <ClipboardList size={18} /> },
  { href: "/account", label: "Account", icon: <UserCircle2 size={18} /> }
];

export function AppShell({
  session,
  children
}: {
  session: SessionContext;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top-row">
          <BrandLogo title="VikleanPM: Property Management App" subtitle="" />

          <div className="header-account">
            <div className="header-user">
              <p className="session-role">{session.role}</p>
              <strong>{session.name}</strong>
              <span className="header-email">{session.email}</span>
            </div>

            <form action={signOutAction}>
              <button className="ghost-button sign-out-button" type="submit">
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="main-panel">{children}</main>
    </div>
  );
}
