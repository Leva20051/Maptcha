import { SubmitButton } from "@/components/submit-button";
import { requireSession } from "@/lib/auth";
import {
  getCuratorDashboardData,
  getRegularDashboardData,
  getSessionUserById,
} from "@/lib/data";
import {
  savePreferencesAction,
  updateAdminProfileAction,
  updateCuratorProfileAction,
  updateRegularProfileAction,
} from "@/lib/actions";
import { ATTRIBUTE_NAMES } from "@/lib/constants";

export default async function AccountPage() {
  const session = await requireSession();
  const baseUser = await getSessionUserById(session.userId);

  if (!baseUser) {
    throw new Error("User not found.");
  }

  const regularData = session.role === "regular" ? await getRegularDashboardData(session.userId) : null;
  const curatorData = session.role === "curator" ? await getCuratorDashboardData(session.userId) : null;

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Account settings</span>
          <h1>Keep your profile and weighting model current.</h1>
          <p>
            Update your account identity, adjust preference weights, and keep your curator profile
            presentation aligned with how you want the app to rank venues.
          </p>
        </section>

        <section className="split-grid">
          <article className="glass-card stack">
            <span className="eyebrow">Profile</span>
            <h2>{baseUser.username}</h2>
            <p>{baseUser.email}</p>
            {session.role === "regular" ? (
              <form action={updateRegularProfileAction} className="stack">
                <div className="field">
                  <label htmlFor="username">Username</label>
                  <input id="username" name="username" defaultValue={baseUser.username} required />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" defaultValue={baseUser.email} required />
                </div>
                <SubmitButton label="Save regular profile" pendingLabel="Saving..." />
              </form>
            ) : null}

            {session.role === "curator" ? (
              <form action={updateCuratorProfileAction} className="stack">
                <div className="field">
                  <label htmlFor="username">Username</label>
                  <input id="username" name="username" defaultValue={baseUser.username} required />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" defaultValue={baseUser.email} required />
                </div>
                <div className="field">
                  <label htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" defaultValue={curatorData?.curator?.bio ?? ""} />
                </div>
                <SubmitButton label="Save curator profile" pendingLabel="Saving..." />
              </form>
            ) : null}

            {session.role === "admin" ? (
              <form action={updateAdminProfileAction} className="stack">
                <div className="field">
                  <label htmlFor="username">Username</label>
                  <input id="username" name="username" defaultValue={baseUser.username} required />
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" defaultValue={baseUser.email} required />
                </div>
                <SubmitButton label="Save admin profile" pendingLabel="Saving..." />
              </form>
            ) : null}
          </article>

          {session.role === "regular" && regularData ? (
            <article className="glass-card stack">
              <span className="eyebrow">Personalization</span>
              <h2>Adjust attribute weights</h2>
              <p>Your personalized venue score uses these weights when ranking places for you.</p>
              <form action={savePreferencesAction} className="stack">
                <div className="form-grid">
                  {ATTRIBUTE_NAMES.map((attribute) => (
                    <div key={attribute} className="field">
                      <label htmlFor={`pref_${attribute}`}>{attribute}</label>
                      <select
                        id={`pref_${attribute}`}
                        name={`pref_${attribute}`}
                        defaultValue={String(regularData.preferences[attribute] ?? 3)}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <SubmitButton label="Save weighting profile" pendingLabel="Saving..." />
              </form>
            </article>
          ) : null}

          {session.role === "curator" && curatorData?.curator ? (
            <article className="glass-card stack">
              <span className="eyebrow">Curator status</span>
              <h2>{curatorData.curator.reputationScore}/100 reputation</h2>
              <p>
                Accuracy {curatorData.curator.accuracyScore}/100 · {curatorData.curator.followerCount} followers ·{" "}
                {curatorData.curator.recommendationCount} recommendations
              </p>
              <div className="chip-row">
                {curatorData.curator.categories.map((category) => (
                  <span key={category} className="chip">
                    {category}
                  </span>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </div>
  );
}
