import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { loginRegularAction } from "@/lib/actions";

export default function UserLoginPage() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Regular User Login</span>
          <h1>Sign in and keep your discovery profile in sync.</h1>
          <p>
            Access your personalized venue scoring, badges, follows, review history, and recent check-ins
            from the same app layout you use everywhere else.
          </p>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Account Access</span>
              <h2>Sign in as a regular user</h2>
            </div>
            <Link href="/register/user" className="button button-secondary">
              Create account
            </Link>
          </div>
          <form action={loginRegularAction} className="stack">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="identifier">Username or email</label>
                <input id="identifier" name="identifier" placeholder="personA or personA@gmail.com" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Your password" required />
              </div>
            </div>
            <div className="button-row">
              <SubmitButton label="Sign in as Regular User" pendingLabel="Signing in..." />
              <Link href="/venues" className="button button-ghost">
                Continue browsing venues
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
