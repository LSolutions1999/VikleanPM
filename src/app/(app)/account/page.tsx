import { PageHeader } from "@/components/PageHeader";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { requireSession } from "@/lib/session";

export default async function AccountPage() {
  const session = await requireSession();

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Account"
        title="Account"
        description="Manage your account details."
      />

      <section className="panel">
        <div className="account-profile-header">
          <div>
            <p className="eyebrow">Signed-in user</p>
            <h3>{session.name}</h3>
          </div>
          <form action={signOutAction}>
            <button className="ghost-button account-sign-out" type="submit">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
        <div className="detail-list">
          <div className="detail-row">
            <strong>Email</strong>
            <span>{session.email}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
