import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { registerCuratorAction } from "@/lib/actions";

export default function CuratorRegisterPage() {
  return (
    <div className="auth-wrap">
      <div className="shell">
        <section className="auth-card stack">
          <div className="stack">
            <span className="eyebrow">Create Curator Account</span>
            <h1>Apply as a curator</h1>
            <p>Curators can manage expertise categories, submit venues, publish recommendations, and build a follower base.</p>
          </div>
          <form action={registerCuratorAction} className="stack">
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
            <div className="field">
              <label htmlFor="bio">Curator bio</label>
              <textarea
                id="bio"
                name="bio"
                placeholder="What kind of venues do you evaluate best?"
              />
            </div>
            <SubmitButton label="Create curator account" pendingLabel="Creating curator..." />
          </form>
          <p>
            Already a curator? <Link href="/login/curator">Log in here</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
