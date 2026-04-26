import Link from "next/link";
import { BadgeCheck, Bean, Coffee, Lamp, Leaf, MessageSquare, Sparkles, Star, Target, ThumbsUp, Users, Wifi } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { followCuratorAction, unfollowCuratorAction } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { getCuratorBrowseData, getSessionUserById } from "@/lib/data";

const curatorVisuals = [
  {
    avatar: "/saira-curator-profile.png",
    tone: "matcha",
    traits: [
      { icon: Leaf, label: "Bean Quality", detail: "Specialist" },
      { icon: Coffee, label: "Brew", detail: "Precision" },
      { icon: Star, label: "Standout", detail: "Espresso" },
    ],
  },
  {
    avatar: "/leo-curator-profile-page.png",
    tone: "strawberry",
    traits: [
      { icon: Lamp, label: "Interior", detail: "Expert" },
      { icon: Bean, label: "Atmosphere", detail: "Curator" },
      { icon: Wifi, label: "Study Flow", detail: "Reviewer" },
    ],
  },
];

export default async function CuratorsPage() {
  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const curators = await getCuratorBrowseData(currentUser?.role === "regular" ? currentUser.userId : undefined);

  return (
    <div className="page curators-view-page">
      <div className="shell page-stack">
        <section className="curators-hero">
          <span className="eyebrow">Curator Directory</span>
          <h1>
            Follow people, <span>not noise.</span>
          </h1>
          <div className="curator-hero-points">
            <div>
              <span>
                <BadgeCheck size={24} aria-hidden="true" />
              </span>
              <strong>Real expertise</strong>
              <small>Curators with proven knowledge</small>
            </div>
            <div>
              <span>
                <Star size={24} aria-hidden="true" />
              </span>
              <strong>Trusted picks</strong>
              <small>Personal recommendations</small>
            </div>
            <div>
              <span>
                <Target size={24} aria-hidden="true" />
              </span>
              <strong>Better results</strong>
              <small>Quality over quantity</small>
            </div>
          </div>
        </section>

        <section className="curator-card-grid">
          {curators.map((curator, index) => {
            const visual = curatorVisuals[index % curatorVisuals.length];
            return (
            <article key={curator.userId} className={`curator-card curator-card-${visual.tone}`}>
              <header>
                <img className="curator-avatar" src={visual.avatar} alt={`${curator.username} profile`} />
                <div className="curator-card-main">
                  <div className="curator-card-actions">
                    <div className="curator-score-row">
                    <span className="curator-score curator-score-reputation">
                      <Star size={15} aria-hidden="true" />
                      {curator.reputationScore}/100
                    </span>
                    <span className="curator-score">
                      <Target size={15} aria-hidden="true" />
                      {curator.accuracyScore}/100
                    </span>
                    </div>
                    <Link href={`/curators/${curator.userId}`} className="curator-view-link">
                      View
                    </Link>
                  </div>
                  <h2>{curator.username}</h2>
                  <div className="chip-row">
                {curator.categories.map((category) => (
                  <span key={category} className="curator-chip">
                    <Sparkles size={13} aria-hidden="true" />
                    {category}
                  </span>
                ))}
                  </div>
                </div>
              </header>
              <div className="curator-trait-row">
                {visual.traits.map((trait) => {
                  const Icon = trait.icon;
                  return (
                    <div key={trait.label}>
                      <Icon size={26} aria-hidden="true" />
                      <strong>{trait.label}</strong>
                      <span>{trait.detail}</span>
                    </div>
                  );
                })}
                <div>
                  <MessageSquare size={26} aria-hidden="true" />
                  <strong>{curator.averageRecommendation ? `${curator.averageRecommendation}/10` : "New"}</strong>
                  <span>Avg Rec</span>
                </div>
              </div>
              <div className="curator-meta">
                <span>
                  <Users size={15} aria-hidden="true" />
                  {curator.followerCount} followers
                </span>
                <span>
                  <ThumbsUp size={15} aria-hidden="true" />
                  {curator.recommendationCount} recommendations
                </span>
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
          );
          })}
        </section>
      </div>
    </div>
  );
}
