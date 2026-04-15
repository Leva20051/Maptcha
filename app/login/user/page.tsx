import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { loginRegularAction } from "@/lib/actions";

export default function UserLoginPage() {
  return (
    <div className="auth-wrap">
      <div className="shell">
        <section className="auth-card stack">
          <div className="stack">
            <span className="eyebrow">Regular User Login</span>
            <h1>Sign in to your discovery profile</h1>
            <p>Access personalized venue scoring, check-ins, follows, badges, and review tools.</p>
          </div>
          <form action={loginRegularAction} className="stack">
            <div className="field">
              <label htmlFor="identifier">Username or email</label>
              <input id="identifier" name="identifier" placeholder="personA or personA@gmail.com" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="Your password" required />
            </div>
            <SubmitButton label="Sign in as Regular User" pendingLabel="Signing in..." />
          </form>
          <p>
            Need an account? <Link href="/register/user">Create a regular user profile</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
