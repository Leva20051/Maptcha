import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { registerRegularAction } from "@/lib/actions";

export default function UserRegisterPage() {
  return (
    <div className="auth-wrap">
      <div className="shell">
        <section className="auth-card stack">
          <div className="stack">
            <span className="eyebrow">Create Regular User Account</span>
            <h1>Build your discovery profile</h1>
            <p>Your account will track preference weights, check-ins, follows, badges, and review history.</p>
          </div>
          <form action={registerRegularAction} className="stack">
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
            <SubmitButton label="Create regular account" pendingLabel="Creating account..." />
          </form>
          <p>
            Already registered? <Link href="/login/user">Log in here</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
