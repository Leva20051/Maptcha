import { SubmitButton } from "@/components/submit-button";
import { loginAdminAction } from "@/lib/actions";

export default function AdminLoginPage() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Admin Login</span>
          <h1>Enter the operations console with the same app framing.</h1>
          <p>
            Access moderation, curator verification, venue management, submissions, badges, tags, and user
            administration without switching into a smaller standalone screen.
          </p>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Admin Access</span>
              <h2>Sign in as an admin</h2>
            </div>
          </div>
          <form action={loginAdminAction} className="stack">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="identifier">Username or email</label>
                <input id="identifier" name="identifier" placeholder="Praveen or praveen@ucalgary.ca" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required />
              </div>
            </div>
            <div className="button-row">
              <SubmitButton label="Sign in as Admin" pendingLabel="Opening admin..." />
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
