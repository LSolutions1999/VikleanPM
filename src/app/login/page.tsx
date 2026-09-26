import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSessionContext } from "@/lib/session";
import Link from "next/link";
import Image from "next/image";

export default async function LoginPage() {
  const session = await getSessionContext();

  if (session) {
    redirect("/properties");
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div className="auth-hero">
          <div className="brand">
            <div className="brand-mark brand-mark-image">
              <Image src="/vikleanworklogored.png" alt="" width={44} height={44} priority />
            </div>
            <div>
              <p className="brand-kicker">Internal use only</p>
              <h1>VikleanWork</h1>
            </div>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">VikleanWork</p>
            <h1>Keep properties, tenants, documents, and tasks in one fast workspace.</h1>
            <p className="page-description">
              Clean dashboards for non-technical staff, with role-aware access for admins, managers, and maintenance teams.
            </p>
          </div>

          <ul className="hero-bullets">
            <li>Role-based access to the data each team member needs.</li>
            <li>Document, rent, and maintenance tracking in one place.</li>
            <li>Responsive layouts for desktop, tablet, and mobile staff workflows.</li>
          </ul>
        </div>

        <div className="auth-panel">
          <div>
            <p className="eyebrow">Sign in</p>
            <h1>Welcome back</h1>
            <p className="page-description">Use your Supabase auth account to access the internal dashboard.</p>
          </div>

          <LoginForm />

          <p className="form-links">
            New account? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
