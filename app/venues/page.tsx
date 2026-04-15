import Link from "next/link";
import VenueMap from "@/components/venue-map";
import { getSession } from "@/lib/auth";
import { getPriceRangeOptions, getSessionUserById, getVenueBrowseData } from "@/lib/data";

type VenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;
  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const search = typeof params.search === "string" ? params.search : "";
  const city = typeof params.city === "string" ? params.city : "";
  const priceRange = typeof params.priceRange === "string" ? params.priceRange : "";
  const tag = typeof params.tag === "string" ? params.tag : "";
  const sort =
    typeof params.sort === "string" && ["trend", "personalized", "rating", "recent"].includes(params.sort)
      ? (params.sort as "trend" | "personalized" | "rating" | "recent")
      : currentUser?.role === "regular"
        ? "personalized"
        : "trend";

  const venues = await getVenueBrowseData({
    search,
    city,
    priceRange,
    tag,
    userId: currentUser?.role === "regular" ? currentUser.userId : undefined,
    sort,
  });

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero stack">
          <span className="eyebrow">Venue Discovery</span>
          <h1>Filter by what actually matters.</h1>
          <p>
            Search venues by name, city, price range, tags, and sorting mode. Regular users also get a
            personalized ranking based on stored attribute preferences and followed curator signals.
          </p>
          <form className="form-grid" method="GET">
            <div className="field">
              <label htmlFor="search">Search</label>
              <input id="search" name="search" defaultValue={search} placeholder="Cafe name" />
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" defaultValue={city} placeholder="Calgary" />
            </div>
            <div className="field">
              <label htmlFor="priceRange">Price range</label>
              <select id="priceRange" name="priceRange" defaultValue={priceRange}>
                <option value="">Any</option>
                {getPriceRangeOptions().map((price) => (
                  <option key={price} value={price}>
                    {price}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tag">Tag</label>
              <input id="tag" name="tag" defaultValue={tag} placeholder="Study Friendly" />
            </div>
            <div className="field">
              <label htmlFor="sort">Sort</label>
              <select id="sort" name="sort" defaultValue={sort}>
                <option value="trend">Trend score</option>
                <option value="rating">Average rating</option>
                <option value="recent">Recently added</option>
                {currentUser?.role === "regular" ? <option value="personalized">Personalized fit</option> : null}
              </select>
            </div>
            <div className="button-row" style={{ alignItems: "end" }}>
              <button className="button button-primary" type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        <section className="two-column">
          <div className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Live map</span>
                <h2>Venue positions</h2>
              </div>
            </div>
            <VenueMap venues={venues} height={520} />
          </div>

          <div className="stack">
            {venues.map((venue) => (
              <article key={venue.venueId} className="list-card">
                <header>
                  <div className="stack">
                    <div className="chip-row">
                      <span className="role-pill">{venue.priceRange ?? "Flexible"}</span>
                      <span className="score-pill">{venue.trendScore}/100 trend</span>
                      {venue.personalizedScore ? <span className="badge">{venue.personalizedScore}/100 fit</span> : null}
                    </div>
                    <h3>{venue.name}</h3>
                  </div>
                  <Link href={`/venues/${venue.venueId}`} className="button button-secondary">
                    Open
                  </Link>
                </header>
                <p>{venue.description}</p>
                <div className="meta">
                  <span>{venue.city}</span>
                  <span>{venue.reviewCount} reviews</span>
                  <span>{venue.averageRating ? `${venue.averageRating}/5 avg` : "No ratings yet"}</span>
                  <span>{venue.averageRecommendation ? `${venue.averageRecommendation}/10 curator avg` : "No recommendations yet"}</span>
                </div>
                <div className="chip-row">
                  {venue.tagNames.map((tagName) => (
                    <span key={tagName} className="chip">
                      {tagName}
                    </span>
                  ))}
                </div>
              </article>
            ))}
            {!venues.length ? <div className="empty-state">No venues matched the current filter set.</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
