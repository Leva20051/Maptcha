import Link from "next/link";

export function AccountAccessShell() {
  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Account Settings</span>
          <h1>Sign in to manage your profile without leaving this layout.</h1>
          <p>
            Account settings depend on who you are signed in as, but the page shell stays the same. Pick the
            area you want to enter and continue from there.
          </p>
        </section>

        <section className="card-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Regular User</span>
            <h2>Dashboard and preferences</h2>
            <p>Open your regular-user dashboard to manage your profile, weighting model, follows, and activity.</p>
            <div className="button-row">
              <Link href="/dashboard" className="button button-primary">
                Regular account access
              </Link>
              <Link href="/venues" className="button button-ghost">
                Browse venues
              </Link>
            </div>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Curator</span>
            <h2>Studio and curator profile</h2>
            <p>Open the curator studio to manage your profile, expertise categories, recommendations, and submissions.</p>
            <div className="button-row">
              <Link href="/curator-studio" className="button button-primary">
                Curator account access
              </Link>
              <Link href="/curators" className="button button-ghost">
                View curators
              </Link>
            </div>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Admin</span>
            <h2>Operations console</h2>
            <p>Open the admin area to manage venues, users, moderation, approvals, tags, badges, and categories.</p>
            <div className="button-row">
              <Link href="/admin" className="button button-primary">
                Admin account access
              </Link>
              <Link href="/venues" className="button button-ghost">
                Open public app
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
