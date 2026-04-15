import { SubmitButton } from "@/components/submit-button";
import {
  adminAssignCuratorCategoryAction,
  approveSubmissionAction,
  assignTagToVenueAction,
  deleteReviewAdminAction,
  deleteUserAction,
  deleteVenueAction,
  rejectSubmissionAction,
  saveBadgeAction,
  saveCategoryAction,
  saveCategoryAttributeAction,
  saveTagAction,
  saveVenueAction,
  verifyCuratorAction,
} from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { ATTRIBUTE_NAMES, BADGE_TYPES, TAG_TYPES } from "@/lib/constants";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminPage() {
  await requireRole("admin");
  const data = await getAdminDashboardData();

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Admin Console</span>
          <h1>Operate the full system from one place.</h1>
          <p>
            Manage venues, curators, tags, badges, reviews, and approvals from one place.
          </p>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Create or edit venue</span>
            <h2>Venue management</h2>
            <form action={saveVenueAction} className="stack">
              <div className="field">
                <label htmlFor="venueId">Existing venue ID to edit</label>
                <input id="venueId" name="venueId" type="number" placeholder="Leave blank to create new" />
              </div>
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
              <SubmitButton label="Save venue" pendingLabel="Saving..." />
            </form>
          </article>

          <div className="stack">
            <article className="glass-card stack">
              <span className="eyebrow">Category management</span>
              <h2>Expertise categories</h2>
              <form action={saveCategoryAction} className="stack">
                <div className="field">
                  <label htmlFor="categoryId">Existing category ID to edit</label>
                  <input id="categoryId" name="categoryId" type="number" />
                </div>
                <div className="field">
                  <label htmlFor="categoryName">Category name</label>
                  <input id="categoryName" name="categoryName" required />
                </div>
                <div className="field">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" />
                </div>
                <SubmitButton label="Save category" pendingLabel="Saving..." />
              </form>
              <form action={saveCategoryAttributeAction} className="stack">
                <div className="field">
                  <label htmlFor="categoryId_attr">Category ID</label>
                  <input id="categoryId_attr" name="categoryId" type="number" required />
                </div>
                <div className="field">
                  <label htmlFor="attributeName">Attribute</label>
                  <select id="attributeName" name="attributeName" defaultValue={ATTRIBUTE_NAMES[0]}>
                    {ATTRIBUTE_NAMES.map((attribute) => (
                      <option key={attribute} value={attribute}>
                        {attribute}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="weight">Weight</label>
                  <input id="weight" name="weight" type="number" min="1" max="5" defaultValue="4" required />
                </div>
                <SubmitButton label="Save category mapping" pendingLabel="Saving..." />
              </form>
            </article>

            <article className="glass-card stack">
              <span className="eyebrow">Curator assignment</span>
              <h2>Assign categories to curators</h2>
              <form action={adminAssignCuratorCategoryAction} className="stack">
                <div className="field">
                  <label htmlFor="curatorId">Curator ID</label>
                  <input id="curatorId" name="curatorId" type="number" required />
                </div>
                <div className="field">
                  <label htmlFor="assignCategoryId">Category ID</label>
                  <input id="assignCategoryId" name="categoryId" type="number" required />
                </div>
                <div className="field">
                  <label htmlFor="enabled">Action</label>
                  <select id="enabled" name="enabled" defaultValue="1">
                    <option value="1">Assign</option>
                    <option value="0">Remove</option>
                  </select>
                </div>
                <SubmitButton label="Apply category assignment" pendingLabel="Saving..." />
              </form>
            </article>
          </div>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Tag management</span>
            <h2>Venue tags</h2>
            <form action={saveTagAction} className="stack">
              <div className="field">
                <label htmlFor="tagId">Existing tag ID to edit</label>
                <input id="tagId" name="tagId" type="number" />
              </div>
              <div className="field">
                <label htmlFor="tagName">Tag name</label>
                <input id="tagName" name="tagName" required />
              </div>
              <div className="field">
                <label htmlFor="tagType">Tag type</label>
                <select id="tagType" name="tagType" defaultValue={TAG_TYPES[0]}>
                  {TAG_TYPES.map((tagType) => (
                    <option key={tagType} value={tagType}>
                      {tagType}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton label="Save tag" pendingLabel="Saving..." />
            </form>
            <form action={assignTagToVenueAction} className="stack">
              <div className="field">
                <label htmlFor="venueId_assign">Venue ID</label>
                <input id="venueId_assign" name="venueId" type="number" required />
              </div>
              <div className="field">
                <label htmlFor="assignTagId">Tag ID</label>
                <input id="assignTagId" name="tagId" type="number" required />
              </div>
              <div className="field">
                <label htmlFor="score">Tag score</label>
                <input id="score" name="score" type="number" min="1" max="5" defaultValue="4" required />
              </div>
              <SubmitButton label="Assign tag to venue" pendingLabel="Assigning..." />
            </form>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Badge management</span>
            <h2>Gamification rules</h2>
            <form action={saveBadgeAction} className="stack">
              <div className="field">
                <label htmlFor="badgeId">Existing badge ID to edit</label>
                <input id="badgeId" name="badgeId" type="number" />
              </div>
              <div className="field">
                <label htmlFor="badgeType">Badge type</label>
                <select id="badgeType" name="badgeType" defaultValue={BADGE_TYPES[0]}>
                  {BADGE_TYPES.map((badgeType) => (
                    <option key={badgeType} value={badgeType}>
                      {badgeType}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" required />
              </div>
              <div className="field">
                <label htmlFor="ptsRequired">Points required</label>
                <input id="ptsRequired" name="ptsRequired" type="number" min="0" defaultValue="0" required />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" />
              </div>
              <SubmitButton label="Save badge" pendingLabel="Saving..." />
            </form>
          </article>
        </section>

        <section className="glass-card stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Curator approvals</span>
              <h2>Verification and submissions</h2>
            </div>
          </div>
          <div className="card-grid">
            {data.curators.map((curator) => (
              <article key={curator.userId} className="list-card">
                <header>
                  <div className="stack">
                    <div className="chip-row">
                      <span className="score-pill">{curator.reputationScore}/100 reputation</span>
                      <span className="badge">{curator.verifiedAt ?? "Unverified"}</span>
                    </div>
                    <h3>{curator.username}</h3>
                  </div>
                </header>
                <p>{curator.bio}</p>
                <form action={verifyCuratorAction}>
                  <input type="hidden" name="curatorId" value={curator.userId} />
                  <SubmitButton label="Verify curator" pendingLabel="Verifying..." />
                </form>
              </article>
            ))}
          </div>
          <div className="stack">
            {data.pendingSubmissions.map((submission) => (
              <article key={submission.submissionId} className="list-card">
                <header>
                  <div className="stack">
                    <div className="chip-row">
                      <span className="role-pill">{submission.status}</span>
                      <span className="badge">{submission.submittedAt}</span>
                    </div>
                    <h3>{submission.name}</h3>
                  </div>
                </header>
                <p>
                  Submitted by {submission.curatorName} · {submission.city} · {submission.priceRange ?? "Unpriced"}
                </p>
                <div className="button-row">
                  <form action={approveSubmissionAction}>
                    <input type="hidden" name="submissionId" value={submission.submissionId} />
                    <SubmitButton label="Approve submission" pendingLabel="Approving..." />
                  </form>
                  <form action={rejectSubmissionAction} className="stack">
                    <input type="hidden" name="submissionId" value={submission.submissionId} />
                    <div className="field">
                      <label htmlFor={`adminNote-${submission.submissionId}`}>Admin note</label>
                      <input id={`adminNote-${submission.submissionId}`} name="adminNote" />
                    </div>
                    <SubmitButton label="Reject submission" pendingLabel="Rejecting..." />
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">User management</span>
            <h2>Registered accounts</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.userId}>
                      <td>{user.userId}</td>
                      <td>
                        <strong>{user.username}</strong>
                        <div className="meta">{user.email}</div>
                      </td>
                      <td>{user.roleLabel}</td>
                      <td>{String(user.regDate)}</td>
                      <td>
                        <form action={deleteUserAction}>
                          <input type="hidden" name="userId" value={user.userId} />
                          <button className="button button-ghost" type="submit">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="glass-card stack">
            <span className="eyebrow">Review moderation</span>
            <h2>Latest reviews</h2>
            <div className="stack">
              {data.recentReviews.map((review) => (
                <article key={review.reviewId} className="list-card">
                  <header>
                    <div className="stack">
                      <div className="chip-row">
                        <span className="badge">{review.postedAt}</span>
                      </div>
                      <h3>
                        {review.username} on {review.venueName}
                      </h3>
                    </div>
                  </header>
                  <p>{review.comment}</p>
                  <form action={deleteReviewAdminAction}>
                    <input type="hidden" name="reviewId" value={review.reviewId} />
                    <button className="button button-ghost" type="submit">
                      Remove review
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Current venues</span>
            <h2>Venue list</h2>
            <div className="stack">
              {data.venues.map((venue) => (
                <article key={venue.venueId} className="list-card">
                  <div className="chip-row">
                    <span className="badge">#{venue.venueId}</span>
                    <span className="role-pill">{venue.priceRange ?? "Flexible"}</span>
                  </div>
                  <h3>{venue.name}</h3>
                  <p>{venue.city}</p>
                  <div className="button-row">
                    <form action={deleteVenueAction}>
                      <input type="hidden" name="venueId" value={venue.venueId} />
                      <button className="button button-ghost" type="submit">
                        Delete venue
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <div className="stack">
            <article className="glass-card stack">
              <span className="eyebrow">Categories</span>
              <h2>Expertise map</h2>
              {data.categories.map((category) => (
                <article key={category.categoryId} className="feature-card">
                  <h3>{category.categoryName}</h3>
                  <p>{category.description}</p>
                  <div className="meta">
                    <span>{category.attributeWeights ?? "No attribute mapping yet"}</span>
                  </div>
                </article>
              ))}
            </article>
            <article className="glass-card stack">
              <span className="eyebrow">Tags and badges</span>
              <h2>Current definitions</h2>
              <div className="chip-row">
                {data.tags.map((tag) => (
                  <span key={tag.tagId} className="chip">
                    #{tag.tagId} {tag.tagName} · {tag.tagType}
                  </span>
                ))}
              </div>
              <div className="stack">
                {data.badges.map((badge) => (
                  <div key={badge.badgeId} className="feature-card">
                    <div className="chip-row">
                      <span className="role-pill">{badge.badgeType}</span>
                      <span className="badge">Threshold {badge.ptsRequired}</span>
                    </div>
                    <h3>{badge.name}</h3>
                    <p>{badge.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
