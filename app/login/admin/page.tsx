import { SubmitButton } from "@/components/submit-button";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="auth-wrap">
      <div className="shell">
        <section className="auth-card stack">
          <div className="stack">
            <span className="eyebrow">Admin Login</span>
            <h1>Enter the operations console</h1>
            <p>Manage users, verify curators, moderate reviews, approve submissions, and maintain the dataset.</p>
          </div>
          <form action={loginAdminAction} className="stack">
            <div className="field">
              <label htmlFor="identifier">Username or email</label>
              <input id="identifier" name="identifier" placeholder="Praveen or praveen@ucalgary.ca" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <SubmitButton label="Sign in as Admin" pendingLabel="Opening admin..." />
          </form>
        </section>
      </div>
    </div>
  );
}
