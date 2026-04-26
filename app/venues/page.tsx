import Link from "next/link";
import { ArrowUpDown, Coffee, MapPin, Search, SlidersHorizontal, Sparkles, Star, Wallet } from "lucide-react";
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
    <div className="page venues-view-page">
      <div className="shell page-stack">
        <section className="venues-hero">
          <div className="venues-hero-copy">
            <span className="venues-brand">Maptcha</span>
            <h1>Find cafes that match your mood.</h1>
            <p>Matcha mornings, deep work, soft dates, better sips.</p>
          </div>
          <form className="venue-filter-bar" method="GET">
            <label className="filter-chip" htmlFor="search">
              <Search size={18} aria-hidden="true" />
              <span>Name</span>
              <input id="search" name="search" defaultValue={search} placeholder="Cafe name" />
            </label>
            <label className="filter-chip" htmlFor="city">
              <MapPin size={18} aria-hidden="true" />
              <span>City</span>
              <input id="city" name="city" defaultValue={city} placeholder="Calgary" />
            </label>
            <label className="filter-chip" htmlFor="priceRange">
              <Wallet size={18} aria-hidden="true" />
              <span>Price</span>
              <select id="priceRange" name="priceRange" defaultValue={priceRange}>
                <option value="">Any</option>
                {getPriceRangeOptions().map((price) => (
                  <option key={price} value={price}>
                    {price}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-chip" htmlFor="tag">
              <Sparkles size={18} aria-hidden="true" />
              <span>Vibe</span>
              <input id="tag" name="tag" defaultValue={tag} placeholder="Study Friendly" />
            </label>
            <label className="filter-chip" htmlFor="sort">
              <ArrowUpDown size={18} aria-hidden="true" />
              <span>Sort</span>
              <select id="sort" name="sort" defaultValue={sort}>
                <option value="trend">Trending</option>
                <option value="rating">Rating</option>
                <option value="recent">New</option>
                {currentUser?.role === "regular" ? <option value="personalized">For you</option> : null}
              </select>
            </label>
            <button className="button button-primary venue-filter-button" type="submit">
              <SlidersHorizontal size={18} aria-hidden="true" />
              Tune
            </button>
          </form>
        </section>

        <section className="venues-layout">
          <div className="venues-map-panel">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Nearby</span>
                <h2>Map view</h2>
              </div>
            </div>
            <VenueMap venues={venues} height={520} />
          </div>

          <div className="venues-list">
            {venues.map((venue) => (
              <article key={venue.venueId} className="venue-card">
                <header>
                  <div>
                    <div className="venue-card-topline">
                      <span>
                        <MapPin size={15} aria-hidden="true" />
                        {venue.city}
                      </span>
                      <span>
                        <Coffee size={15} aria-hidden="true" />
                        {venue.priceRange ?? "Flexible"}
                      </span>
                    </div>
                    <h3>{venue.name}</h3>
                  </div>
                  <div className="venue-rating">
                    <Star size={17} aria-hidden="true" />
                    <strong>{venue.averageRating ?? "New"}</strong>
                  </div>
                </header>
                <div className="venue-card-metrics">
                  <span>{venue.trendScore}/100 trend</span>
                  {venue.personalizedScore ? <span>{venue.personalizedScore}/100 fit</span> : null}
                  <span>{venue.reviewCount} reviews</span>
                </div>
                <div className="chip-row">
                  {venue.tagNames.slice(0, 4).map((tagName) => (
                    <span key={tagName} className="chip">
                      {tagName}
                    </span>
                  ))}
                </div>
                <Link href={`/venues/${venue.venueId}`} className="venue-card-link">
                  View cafe
                </Link>
              </article>
            ))}
            {!venues.length ? (
              <div className="empty-state">
                <h3>No cafes found</h3>
                <p>Try a softer filter.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
