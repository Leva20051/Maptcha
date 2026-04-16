import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { registerRegularAction } from "@/lib/actions";

export default function UserRegisterPage() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Create Regular User Account</span>
          <h1>Build your discovery profile in the same main app layout.</h1>
          <p>
            Your account tracks preferences, follows, badges, reviews, and check-ins so recommendations
            get better the more you use the product.
          </p>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Registration</span>
              <h2>Create a regular user account</h2>
            </div>
            <Link href="/login/user" className="button button-secondary">
              Existing user login
            </Link>
          </div>
          <form action={registerRegularAction} className="stack">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required />
              </div>
            </div>
            <div className="button-row">
              <SubmitButton label="Create regular account" pendingLabel="Creating account..." />
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
