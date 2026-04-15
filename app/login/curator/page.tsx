import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { loginCuratorAction } from "@/lib/actions";

export default function CuratorLoginPage() {
  return (
    <div className="auth-wrap">
      <div className="shell">
        <section className="auth-card stack">
          <div className="stack">
            <span className="eyebrow">Curator Login</span>
            <h1>Open your curator studio</h1>
            <p>Manage recommendations, specializations, submissions, followers, and expert reviews.</p>
          </div>
          <form action={loginCuratorAction} className="stack">
            <div className="field">
              <label htmlFor="identifier">Username or email</label>
              <input id="identifier" name="identifier" placeholder="saira or saira@ucalgary.ca" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <SubmitButton label="Sign in as Curator" pendingLabel="Opening studio..." />
          </form>
          <p>
            New curator? <Link href="/register/curator">Create a curator account</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
