import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { registerCuratorAction } from "@/lib/actions";

export default function CuratorRegisterPage() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Create Curator Account</span>
          <h1>Apply as a curator without dropping into a narrow form view.</h1>
          <p>
            Curators can manage expertise categories, submit venues, publish recommendations, write expert
            reviews, and build a follower base from the same full app shell.
          </p>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Registration</span>
              <h2>Create a curator account</h2>
            </div>
            <Link href="/login/curator" className="button button-secondary">
              Existing curator login
            </Link>
          </div>
          <form action={registerCuratorAction} className="stack">
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
            <div className="field">
              <label htmlFor="bio">Curator bio</label>
              <textarea
                id="bio"
                name="bio"
                placeholder="What kind of venues do you evaluate best?"
              />
            </div>
            <div className="button-row">
              <SubmitButton label="Create curator account" pendingLabel="Creating curator..." />
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
