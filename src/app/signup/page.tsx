import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/SignupForm";
import { getSessionContext } from "@/lib/session";

export default async function SignupPage() {
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
              <h1>Property Manager</h1>
            </div>
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Create account</p>
            <h1>Set up your staff login.</h1>
            <p className="page-description">
              New accounts are created through Supabase Auth. After signup, you can sign in and use the internal dashboard.
            </p>
          </div>

          <ul className="hero-bullets">
            <li>Email confirmation is sent by Supabase if enabled.</li>
            <li>Your account defaults to manager access until an admin changes it.</li>
            <li>You can update role mappings later without rebuilding the app.</li>
          </ul>
        </div>

        <div className="auth-panel">
          <div>
            <p className="eyebrow">Sign up</p>
            <h1>Create your account</h1>
            <p className="page-description">Use your work email and a password you can remember.</p>
          </div>

          <SignupForm />

          <p className="form-links">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
