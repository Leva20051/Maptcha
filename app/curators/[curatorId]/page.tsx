import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { followCuratorAction, unfollowCuratorAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { getCuratorDetail, getSessionUserById } from "@/lib/data";

type CuratorDetailPageProps = {
  params: Promise<{ curatorId: string }>;
};

export default async function CuratorDetailPage({ params }: CuratorDetailPageProps) {
  const { curatorId } = await params;
  const numericCuratorId = Number(curatorId);

  if (!Number.isFinite(numericCuratorId)) {
    notFound();
  }

  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const detail = await getCuratorDetail(
    numericCuratorId,
    currentUser?.role === "regular" ? currentUser.userId : undefined,
  );

  if (!detail) {
    notFound();
  }

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <div className="chip-row">
            <span className="score-pill">{detail.curator.reputationScore}/100 reputation</span>
            <span className="badge">{detail.curator.accuracyScore}/100 accuracy</span>
            <span className="role-pill">{detail.curator.verifiedAt ? "Verified" : "Awaiting verification"}</span>
          </div>
          <h1>{detail.curator.username}</h1>
          <p>{detail.curator.bio ?? "No curator bio yet."}</p>
          <div className="chip-row">
            {detail.curator.categories.map((category) => (
              <span key={category} className="chip">
                {category}
              </span>
            ))}
          </div>
          <div className="meta">
            <span>{detail.curator.followerCount} followers</span>
            <span>{detail.curator.recommendationCount} recommendations</span>
            <span>{detail.curator.averageRecommendation ? `${detail.curator.averageRecommendation}/10 recommendation average` : "No recs yet"}</span>
          </div>
          {currentUser?.role === "regular" ? (
            detail.curator.isFollowed ? (
              <form action={unfollowCuratorAction}>
                <input type="hidden" name="curatorId" value={detail.curator.userId} />
                <SubmitButton label="Unfollow curator" pendingLabel="Updating..." />
              </form>
            ) : (
              <form action={followCuratorAction}>
                <input type="hidden" name="curatorId" value={detail.curator.userId} />
                <SubmitButton label="Follow curator" pendingLabel="Following..." />
              </form>
            )
          ) : null}
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Recommendations</span>
                <h2>Published venue picks</h2>
              </div>
              <Link href="/venues" className="button button-secondary">
                Browse venues
              </Link>
            </div>
            {detail.recommendations.length ? (
              <div className="stack">
                {detail.recommendations.map((recommendation) => (
                  <article key={`${recommendation.venueId}-${recommendation.createdAt}`} className="list-card">
                    <header>
                      <div className="stack">
                        <span className="score-pill">{recommendation.recScore}/10</span>
                        <h3>{recommendation.venueName}</h3>
                      </div>
                    </header>
                    <p>{recommendation.recNote}</p>
                    <div className="meta">
                      <span>{recommendation.createdAt}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">No recommendations yet.</div>
            )}
          </article>

          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Recent reviews</span>
                <h2>Expert review samples</h2>
              </div>
            </div>
            {detail.reviews.length ? (
              <div className="stack">
                {detail.reviews.map((review) => (
                  <article key={review.reviewId} className="feature-card">
                    <div className="chip-row">
                      <span className="badge">{review.postedAt}</span>
                      <span className="role-pill">{review.role}</span>
                    </div>
                    <h3>Venue #{review.venueId}</h3>
                    <p>{review.comment ?? "No review text."}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">No expert reviews yet.</div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}
