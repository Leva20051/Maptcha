import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import {
  saveRecommendationAction,
  submitVenueAction,
  toggleCuratorCategoryAction,
  updateCuratorProfileAction,
} from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { getCuratorDashboardData, getVenueBrowseData } from "@/lib/data";

export default async function CuratorStudioPage() {
  const session = await requireRole("curator");
  const data = await getCuratorDashboardData(session.userId);
  const venues = await getVenueBrowseData();

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Curator Studio</span>
          <h1>Manage your profile and picks.</h1>
          <p>
            Update your curator profile, organize your specialties, publish recommendations, and submit
            promising venues for review.
          </p>
          {data.curator ? (
            <div className="stat-row">
              <div className="stat-card">
                <span className="eyebrow">Reputation</span>
                <strong>{data.curator.reputationScore}</strong>
              </div>
              <div className="stat-card">
                <span className="eyebrow">Accuracy</span>
                <strong>{data.curator.accuracyScore}</strong>
              </div>
              <div className="stat-card">
                <span className="eyebrow">Followers</span>
                <strong>{data.curator.followerCount}</strong>
              </div>
              <div className="stat-card">
                <span className="eyebrow">Recommendations</span>
                <strong>{data.curator.recommendationCount}</strong>
              </div>
            </div>
          ) : null}
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Profile</span>
            <h2>Public curator identity</h2>
            <form action={updateCuratorProfileAction} className="stack">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" defaultValue={session.username} required />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" defaultValue={session.email} required />
              </div>
              <div className="field">
                <label htmlFor="bio">Bio</label>
                <textarea id="bio" name="bio" defaultValue={data.curator?.bio ?? ""} />
              </div>
              <SubmitButton label="Save curator profile" pendingLabel="Saving..." />
            </form>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Expertise areas</span>
            <h2>Category selection</h2>
            <div className="stack">
              {data.categories.map((category) => (
                <article key={category.categoryId} className="feature-card">
                  <div className="chip-row">
                    <span className="role-pill">{category.isSelected ? "Selected" : "Available"}</span>
                  </div>
                  <h3>{category.categoryName}</h3>
                  <p>{category.description}</p>
                  <form action={toggleCuratorCategoryAction}>
                    <input type="hidden" name="categoryId" value={category.categoryId} />
                    <input type="hidden" name="enabled" value={category.isSelected ? "0" : "1"} />
                    <SubmitButton
                      label={category.isSelected ? "Remove specialization" : "Add specialization"}
                      pendingLabel="Updating..."
                    />
                  </form>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Recommendations</span>
            <h2>Publish a recommendation</h2>
            <form action={saveRecommendationAction} className="stack">
              <div className="field">
                <label htmlFor="venueId">Venue</label>
                <select id="venueId" name="venueId" required>
                  <option value="">Select a venue</option>
                  {venues.map((venue) => (
                    <option key={venue.venueId} value={venue.venueId}>
                      {venue.name} · {venue.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="recScore">Recommendation score</label>
                <input id="recScore" name="recScore" type="number" min="1" max="10" defaultValue="8" required />
              </div>
              <div className="field">
                <label htmlFor="recNote">Recommendation note</label>
                <textarea id="recNote" name="recNote" placeholder="What makes this venue worth following?" />
              </div>
              <SubmitButton label="Save recommendation" pendingLabel="Saving..." />
            </form>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Venue submission</span>
            <h2>Submit a new venue for approval</h2>
            <form action={submitVenueAction} className="stack">
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" required />
                </div>
                <div className="field">
                  <label htmlFor="street">Street</label>
                  <input id="street" name="street" required />
                </div>
                <div className="field">
                  <label htmlFor="city">City</label>
                  <input id="city" name="city" defaultValue="Calgary" required />
                </div>
                <div className="field">
                  <label htmlFor="postalCode">Postal code</label>
                  <input id="postalCode" name="postalCode" required />
                </div>
                <div className="field">
                  <label htmlFor="priceRange">Price range</label>
                  <select id="priceRange" name="priceRange" defaultValue="$$">
                    <option value="">Unknown</option>
                    <option value="$">$</option>
                    <option value="$$">$$</option>
                    <option value="$$$">$$$</option>
                    <option value="$$$$">$$$$</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" />
                </div>
                <div className="field">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" placeholder="https://..." />
                </div>
                <div className="field">
                  <label htmlFor="latitude">Latitude</label>
                  <input id="latitude" name="latitude" type="number" step="0.0000001" />
                </div>
                <div className="field">
                  <label htmlFor="longitude">Longitude</label>
                  <input id="longitude" name="longitude" type="number" step="0.0000001" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" />
              </div>
              <SubmitButton label="Submit venue" pendingLabel="Submitting..." />
            </form>
          </article>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Followers</span>
                <h2>Your audience</h2>
              </div>
            </div>
            {data.followers.length ? (
              <div className="stack">
                {data.followers.map((follower) => (
                  <article key={`${follower.userId}-${follower.followedAt}`} className="feature-card">
                    <h3>{follower.username}</h3>
                    <div className="meta">
                      <span>{follower.email}</span>
                      <span>{follower.followedAt}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">No followers yet.</div>
            )}
          </article>

          <article className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Venue submissions</span>
                <h2>Review status</h2>
              </div>
            </div>
            {data.submissions.length ? (
              <div className="stack">
                {data.submissions.map((submission) => (
                  <article key={submission.submissionId} className="feature-card">
                    <div className="chip-row">
                      <span className="role-pill">{submission.status}</span>
                      <span className="badge">{submission.submittedAt}</span>
                    </div>
                    <h3>{submission.name}</h3>
                    <p>{submission.city}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">No venue submissions yet.</div>
            )}
          </article>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Recent activity</span>
              <h2>Your latest recommendations and reviews</h2>
            </div>
            <Link href="/venues" className="button button-secondary">
              Open venue pages
            </Link>
          </div>
          <div className="split-grid">
            <div className="stack">
              {data.recentRecommendations.length ? (
                data.recentRecommendations.map((recommendation) => (
                  <article key={`${recommendation.venueId}-${recommendation.createdAt}`} className="list-card">
                    <div className="chip-row">
                      <span className="score-pill">{recommendation.recScore}/10</span>
                      <span className="badge">{recommendation.createdAt}</span>
                    </div>
                    <h3>{recommendation.venueName}</h3>
                    <p>{recommendation.recNote}</p>
                  </article>
                ))
              ) : (
                <div className="empty-state">No recommendations yet.</div>
              )}
            </div>
            <div className="stack">
              {data.recentReviews.length ? (
                data.recentReviews.map((review) => (
                  <article key={review.reviewId} className="list-card">
                    <div className="chip-row">
                      <span className="badge">{review.postedAt}</span>
                    </div>
                    <h3>{review.venueName}</h3>
                    <p>{review.comment}</p>
                  </article>
                ))
              ) : (
                <div className="empty-state">No reviews yet.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
