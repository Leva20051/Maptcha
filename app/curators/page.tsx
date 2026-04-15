import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { followCuratorAction, unfollowCuratorAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { getCuratorBrowseData, getSessionUserById } from "@/lib/data";

export default async function CuratorsPage() {
  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const curators = await getCuratorBrowseData(currentUser?.role === "regular" ? currentUser.userId : undefined);

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Curator Directory</span>
          <h1>Follow people, not noise.</h1>
          <p>
            Curators carry explicit expertise areas, recommendation histories, follower counts, and derived
            accuracy/reputation metrics rather than a vague influencer signal.
          </p>
        </section>

        <section className="card-grid">
          {curators.map((curator) => (
            <article key={curator.userId} className="list-card">
              <header>
                <div className="stack">
                  <div className="chip-row">
                    <span className="score-pill">{curator.reputationScore}/100 reputation</span>
                    <span className="badge">{curator.accuracyScore}/100 accuracy</span>
                  </div>
                  <h2>{curator.username}</h2>
                </div>
                <Link href={`/curators/${curator.userId}`} className="button button-secondary">
                  View
                </Link>
              </header>
              <p>{curator.bio ?? "No curator bio yet."}</p>
              <div className="chip-row">
                {curator.categories.map((category) => (
                  <span key={category} className="chip">
                    {category}
                  </span>
                ))}
              </div>
              <div className="meta">
                <span>{curator.followerCount} followers</span>
                <span>{curator.recommendationCount} recommendations</span>
                <span>{curator.averageRecommendation ? `${curator.averageRecommendation}/10 avg rec` : "No recs yet"}</span>
              </div>
              {currentUser?.role === "regular" ? (
                curator.isFollowed ? (
                  <form action={unfollowCuratorAction}>
                    <input type="hidden" name="curatorId" value={curator.userId} />
                    <SubmitButton label="Unfollow curator" pendingLabel="Updating..." />
                  </form>
                ) : (
                  <form action={followCuratorAction}>
                    <input type="hidden" name="curatorId" value={curator.userId} />
                    <SubmitButton label="Follow curator" pendingLabel="Following..." />
                  </form>
                )
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
