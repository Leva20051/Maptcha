import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { loginCuratorAction } from "@/lib/actions";

export default function CuratorLoginPage() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Curator Login</span>
          <h1>Open your curator studio without leaving the app layout.</h1>
          <p>
            Manage expertise categories, recommendations, venue submissions, followers, and expert reviews
            from the same full-width interface as the rest of the product.
          </p>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Curator Access</span>
              <h2>Sign in as a curator</h2>
            </div>
            <Link href="/register/curator" className="button button-secondary">
              Create curator account
            </Link>
          </div>
          <form action={loginCuratorAction} className="stack">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="identifier">Username or email</label>
                <input id="identifier" name="identifier" placeholder="saira or saira@ucalgary.ca" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required />
              </div>
            </div>
            <div className="button-row">
              <SubmitButton label="Sign in as Curator" pendingLabel="Opening studio..." />
              <Link href="/curators" className="button button-ghost">
                Browse curators
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
