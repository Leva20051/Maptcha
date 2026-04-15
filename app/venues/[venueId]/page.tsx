import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import VenueMap from "@/components/venue-map";
import {
  createCheckInAction,
  deleteOwnReviewAction,
  deleteRecommendationAction,
  saveRecommendationAction,
  saveReviewAction,
} from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { ATTRIBUTE_NAMES } from "@/lib/constants";
import { getSessionUserById, getVenueDetail } from "@/lib/data";

type VenueDetailPageProps = {
  params: Promise<{ venueId: string }>;
};

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { venueId } = await params;
  const numericVenueId = Number(venueId);

  if (!Number.isFinite(numericVenueId)) {
    notFound();
  }

  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const detail = await getVenueDetail(numericVenueId, currentUser?.userId);

  if (!detail) {
    notFound();
  }

  const { venue } = detail;

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <div className="venue-title-row">
            <div className="stack">
              <div className="chip-row">
                <span className="role-pill">{venue.priceRange ?? "Flexible"}</span>
                <span className="score-pill">{venue.trendScore}/100 trend</span>
                {venue.personalizedScore ? <span className="badge">{venue.personalizedScore}/100 fit</span> : null}
              </div>
              <h1>{venue.name}</h1>
              <p>{venue.description}</p>
            </div>
            <div className="stack">
              <Link href="/venues" className="button button-secondary">
                Back to venues
              </Link>
            </div>
          </div>
          <div className="meta">
            <span>{venue.street}</span>
            <span>{venue.city}</span>
            <span>{venue.phone ?? "No phone listed"}</span>
            {venue.website ? (
              <a href={venue.website} target="_blank" rel="noreferrer">
                Website
              </a>
            ) : null}
          </div>
          <div className="chip-row">
            {venue.tagNames.map((tagName) => (
              <span key={tagName} className="chip">
                {tagName}
              </span>
            ))}
          </div>
        </section>

        <section className="two-column">
          <div className="stack">
            <article className="glass-card stack">
              <div className="section-heading">
                <div className="stack">
                  <span className="eyebrow">Map and metrics</span>
                  <h2>Venue overview</h2>
                </div>
              </div>
              <VenueMap venues={[venue]} height={340} />
              <div className="stat-row">
                <div className="stat-card">
                  <span className="eyebrow">Average rating</span>
                  <strong>{venue.averageRating ?? "New"}</strong>
                </div>
                <div className="stat-card">
                  <span className="eyebrow">Curator average</span>
                  <strong>{venue.averageRecommendation ?? "N/A"}</strong>
                </div>
                <div className="stat-card">
                  <span className="eyebrow">Reviews</span>
                  <strong>{venue.reviewCount}</strong>
                </div>
                <div className="stat-card">
                  <span className="eyebrow">Check-ins</span>
                  <strong>{detail.checkInCount}</strong>
                </div>
              </div>
              <div className="card-grid">
                {ATTRIBUTE_NAMES.map((attribute) => (
                  <div key={attribute} className="feature-card">
                    <span className="eyebrow">{attribute}</span>
                    <h3>{venue.attributeAverages[attribute] ?? "N/A"}</h3>
                    <p>Average score from recent reviews.</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="glass-card stack">
              <div className="section-heading">
                <div className="stack">
                  <span className="eyebrow">Reviews</span>
                  <h2>Structured visitor feedback</h2>
                </div>
              </div>
              {detail.reviews.length ? (
                <div className="stack">
                  {detail.reviews.map((review) => (
                    <article key={review.reviewId} className="list-card">
                      <header>
                        <div className="stack">
                          <div className="chip-row">
                            <span className="role-pill">{review.role}</span>
                            <span className="badge">{review.postedAt}</span>
                          </div>
                          <h3>{review.username}</h3>
                        </div>
                        {currentUser?.userId === review.userId ? (
                          <form action={deleteOwnReviewAction}>
                            <input type="hidden" name="reviewId" value={review.reviewId} />
                            <input type="hidden" name="venueId" value={venue.venueId} />
                            <button className="button button-ghost" type="submit">
                              Delete
                            </button>
                          </form>
                        ) : null}
                      </header>
                      <p>{review.comment ?? "No comment added."}</p>
                      <div className="chip-row">
                        {Object.entries(review.attributeRatings).map(([attribute, value]) => (
                          <span key={attribute} className="chip">
                            {attribute}: {value}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No reviews yet.</div>
              )}
            </article>
          </div>

          <div className="stack">
            <article className="glass-card stack">
              <span className="eyebrow">Curator layer</span>
              <h2>Recommendations</h2>
              {detail.recommendations.length ? (
                <div className="stack">
                  {detail.recommendations.map((recommendation) => (
                    <article key={`${recommendation.curatorId}-${recommendation.createdAt}`} className="feature-card">
                      <div className="chip-row">
                        <span className="score-pill">{recommendation.recScore ?? "N/A"}/10</span>
                        {recommendation.categories.map((category) => (
                          <span key={category} className="chip">
                            {category}
                          </span>
                        ))}
                      </div>
                      <h3>{recommendation.curatorName}</h3>
                      <p>{recommendation.recNote ?? "No curator note yet."}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No curator recommendations yet.</div>
              )}
            </article>

            {currentUser?.role === "regular" ? (
              <>
                <article className="glass-card stack">
                  <span className="eyebrow">Check in</span>
                  <h2>Log a visit</h2>
                  <form action={createCheckInAction} className="stack">
                    <input type="hidden" name="venueId" value={venue.venueId} />
                    <div className="field">
                      <label htmlFor="notes">Notes</label>
                      <textarea id="notes" name="notes" placeholder="What are you here for?" />
                    </div>
                    <SubmitButton label="Create check-in" pendingLabel="Checking in..." />
                  </form>
                </article>
                <article className="glass-card stack">
                  <span className="eyebrow">Your review</span>
                  <h2>{detail.ownReview ? "Update your review" : "Write a review"}</h2>
                  <form action={saveReviewAction} className="stack">
                    <input type="hidden" name="venueId" value={venue.venueId} />
                    {detail.ownReview ? <input type="hidden" name="reviewId" value={detail.ownReview.reviewId} /> : null}
                    <div className="field">
                      <label htmlFor="comment">Comment</label>
                      <textarea
                        id="comment"
                        name="comment"
                        defaultValue={detail.ownReview?.comment ?? ""}
                        placeholder="How did the visit actually feel?"
                      />
                    </div>
                    <div className="form-grid">
                      {ATTRIBUTE_NAMES.map((attribute) => (
                        <div key={attribute} className="field">
                          <label htmlFor={`rating_${attribute}`}>{attribute}</label>
                          <select
                            id={`rating_${attribute}`}
                            name={`rating_${attribute}`}
                            defaultValue={String(detail.ownReview?.attributeRatings[attribute] ?? "")}
                          >
                            <option value="">Skip</option>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <SubmitButton label="Save review" pendingLabel="Saving review..." />
                  </form>
                </article>
              </>
            ) : null}

            {currentUser?.role === "curator" ? (
              <>
                <article className="glass-card stack">
                  <span className="eyebrow">Curator recommendation</span>
                  <h2>Publish or update recommendation</h2>
                  <form action={saveRecommendationAction} className="stack">
                    <input type="hidden" name="venueId" value={venue.venueId} />
                    <div className="field">
                      <label htmlFor="recScore">Recommendation score (1-10)</label>
                      <input id="recScore" name="recScore" type="number" min="1" max="10" defaultValue="8" required />
                    </div>
                    <div className="field">
                      <label htmlFor="recNote">Curator note</label>
                      <textarea id="recNote" name="recNote" placeholder="Why should your followers care about this venue?" />
                    </div>
                    <SubmitButton label="Save recommendation" pendingLabel="Saving..." />
                  </form>
                  <form action={deleteRecommendationAction}>
                    <input type="hidden" name="venueId" value={venue.venueId} />
                    <button className="button button-ghost" type="submit">
                      Delete my recommendation
                    </button>
                  </form>
                </article>
                <article className="glass-card stack">
                  <span className="eyebrow">Expert review</span>
                  <h2>Write an expert review</h2>
                  <form action={saveReviewAction} className="stack">
                    <input type="hidden" name="venueId" value={venue.venueId} />
                    <div className="field">
                      <label htmlFor="comment">Comment</label>
                      <textarea id="comment" name="comment" placeholder="Professional insights for followers." />
                    </div>
                    <div className="form-grid">
                      {ATTRIBUTE_NAMES.map((attribute) => (
                        <div key={attribute} className="field">
                          <label htmlFor={`rating_${attribute}`}>{attribute}</label>
                          <select id={`rating_${attribute}`} name={`rating_${attribute}`}>
                            <option value="">Skip</option>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <SubmitButton label="Publish expert review" pendingLabel="Publishing..." />
                  </form>
                </article>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
