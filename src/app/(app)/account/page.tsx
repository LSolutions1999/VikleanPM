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
        title="Profile and access"
        description="Review your role, permissions, and the parts of the platform that are visible to you."
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
          <div className="detail-row">
            <strong>Role</strong>
            <span>{session.role}</span>
          </div>
          <div className="detail-row">
            <strong>Visibility</strong>
            <span>{session.role === "admin" ? "All data" : "Scoped data"}</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Permissions</p>
        <h3>What this role can access</h3>
        <div className="detail-list">
          {session.role === "admin" ? (
            <>
              <div className="detail-row">
                <strong>Admin</strong>
                <span>Full access to properties, tenants, tasks, and reporting.</span>
              </div>
              <div className="detail-row">
                <strong>Recommended</strong>
                <span>Assign roles, manage content, and review history across the portfolio.</span>
              </div>
            </>
          ) : session.role === "manager" ? (
            <>
              <div className="detail-row">
                <strong>Manager</strong>
                <span>Read and edit operational data for properties, tenants, and tasks.</span>
              </div>
              <div className="detail-row">
                <strong>Recommended</strong>
                <span>Use this role for day-to-day leasing and operations staff.</span>
              </div>
            </>
          ) : (
            <>
              <div className="detail-row">
                <strong>Maintenance</strong>
                <span>See assigned maintenance tasks, documents, and property notes.</span>
              </div>
              <div className="detail-row">
                <strong>Recommended</strong>
                <span>Ideal for field staff who only need their active work queue.</span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
