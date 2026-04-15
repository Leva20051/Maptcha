import Link from "next/link";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/stat-card";
import { requireSession, getRoleHome } from "@/lib/auth";
import { getRegularDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const session = await requireSession();

  if (session.role !== "regular") {
    redirect(await getRoleHome(session.role));
  }

  const data = await getRegularDashboardData(session.userId);

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Your dashboard</span>
          <h1>Discovery tuned around your preferences.</h1>
          <p>
            Update your weighting profile, keep track of badges and check-ins, and follow the curators who
            best match how you actually choose venues.
          </p>
          <div className="stat-row">
            <StatCard label="Level" value={data.profile?.level ?? 1} />
            <StatCard label="Reviews" value={data.stats.reviewCount} accent="#d2743a" />
            <StatCard label="Check-ins" value={data.stats.checkInCount} />
            <StatCard label="Followed curators" value={data.stats.followCount} />
          </div>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Your priorities</span>
                <h2>Your weighting profile</h2>
              </div>
              <Link href="/account" className="button button-secondary">
                Edit profile
              </Link>
            </div>
            <div className="card-grid">
              {Object.entries(data.preferences).map(([attribute, weight]) => (
                <div key={attribute} className="feature-card">
                  <span className="eyebrow">{attribute}</span>
                  <h3>{weight}/5</h3>
                  <p>This shapes how strongly this factor influences your results.</p>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Badges</span>
                <h2>Collected achievements</h2>
              </div>
            </div>
            {data.earnedBadges.length ? (
              <div className="stack">
                {data.earnedBadges.map((badge) => (
                  <div key={`${badge.badgeId}-${badge.dateEarned}`} className="list-card">
                    <div className="chip-row">
                      <span className="role-pill">{badge.badgeType}</span>
                      <span className="badge">{badge.dateEarned}</span>
                    </div>
                    <h3>{badge.name}</h3>
                    <p>{badge.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No badges yet. Start reviewing, following, and checking in.</div>
            )}
          </article>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Personalized feed</span>
                <h2>Best-fit venues right now</h2>
              </div>
              <Link href="/venues?sort=personalized" className="button button-secondary">
                Full feed
              </Link>
            </div>
            <div className="stack">
              {data.personalizedFeed.map((venue) => (
                <article key={venue.venueId} className="list-card">
                  <header>
                    <div className="stack">
                      <div className="chip-row">
                        <span className="score-pill">{venue.personalizedScore ?? venue.trendScore}/100 fit</span>
                        <span className="role-pill">{venue.priceRange ?? "Flexible"}</span>
                      </div>
                      <h3>{venue.name}</h3>
                    </div>
                    <Link href={`/venues/${venue.venueId}`} className="button button-secondary">
                      Open
                    </Link>
                  </header>
                  <p>{venue.description}</p>
                  <div className="chip-row">
                    {venue.tagNames.slice(0, 4).map((tagName) => (
                      <span key={tagName} className="chip">
                        {tagName}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <div className="stack">
            <article className="glass-card stack">
              <div className="section-heading">
                <div className="stack">
                  <span className="eyebrow">Following</span>
                  <h2>Curators you trust</h2>
                </div>
                <Link href="/curators" className="button button-secondary">
                  Browse curators
                </Link>
              </div>
              {data.followedCurators.length ? (
                <div className="stack">
                  {data.followedCurators.map((curator) => (
                    <article key={curator.userId} className="feature-card">
                      <div className="chip-row">
                        <span className="score-pill">{curator.reputationScore}/100 reputation</span>
                        <span className="badge">{curator.followerCount} followers</span>
                      </div>
                      <h3>{curator.username}</h3>
                      <p>{curator.bio}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Follow curators to add a curated layer to your feed.</div>
              )}
            </article>

            <article className="glass-card stack">
              <div className="section-heading">
                <div className="stack">
                  <span className="eyebrow">Recent check-ins</span>
                  <h2>Your venue trail</h2>
                </div>
              </div>
              {data.recentCheckIns.length ? (
                <div className="stack">
                  {data.recentCheckIns.map((checkIn) => (
                    <div key={`${checkIn.venueId}-${checkIn.checkInTime}`} className="feature-card">
                      <h3>{checkIn.venueName}</h3>
                      <div className="meta">
                        <span>{checkIn.checkInTime}</span>
                      </div>
                      <p>{checkIn.notes ?? "No notes added."}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No check-ins yet.</div>
              )}
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
