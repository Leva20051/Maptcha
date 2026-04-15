import Link from "next/link";
import { ArrowRight, Compass, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import VenueMap from "@/components/venue-map";
import { getSession } from "@/lib/auth";
import { getLandingData, getSessionUserById } from "@/lib/data";

export default async function HomePage() {
  const session = await getSession();
  const currentUser = session ? await getSessionUserById(session.userId) : null;
  const data = await getLandingData(currentUser?.userId);

  return (
    <div className="page">
      <div className="shell page-stack">
        <section className="hero hero-grid">
          <div className="stack">
            <span className="eyebrow">Cafe discovery, but curated</span>
            <h1>Find the right Calgary cafe for what you actually need.</h1>
            <p>
              Find cafes by atmosphere, WiFi, study fit, value, and trusted recommendations so you can
              spend less time comparing tabs and more time choosing the right place.
            </p>
            <div className="button-row">
              <Link href={currentUser ? "/venues" : "/register/user"} className="button button-primary">
                {currentUser ? "Explore Venues" : "Create Regular Account"}
                <ArrowRight size={16} />
              </Link>
              <Link href="/curators" className="button button-secondary">
                Meet Curators
              </Link>
            </div>
            <div className="chip-row">
              <span className="chip">
                <Compass size={14} />
                Quiet study spots
              </span>
              <span className="chip">
                <MapPinned size={14} />
                Neighborhood favorites
              </span>
              <span className="chip">
                <ShieldCheck size={14} />
                Trusted curator picks
              </span>
            </div>
          </div>
          <div className="stack">
            <div className="hero-metrics">
              <article>
                <span className="eyebrow">For Focus</span>
                <strong>Work</strong>
                <p>Look for places with steady WiFi, quiet corners, and room to stay a while.</p>
              </article>
              <article>
                <span className="eyebrow">For Coffee</span>
                <strong>Taste</strong>
                <p>Spot standout espresso, pastries, and house favorites faster.</p>
              </article>
              <article>
                <span className="eyebrow">For Plans</span>
                <strong>Map</strong>
                <p>Browse the city visually when you want something nearby or worth the trip.</p>
              </article>
              <article>
                <span className="eyebrow">For Trust</span>
                <strong>Curators</strong>
                <p>Follow people whose taste matches yours instead of relying on generic averages.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="two-column">
          <div className="glass-card stack">
            <div className="section-heading">
              <div className="stack">
                <span className="eyebrow">Map view</span>
                <h2>See what fits your day</h2>
                <p>
                  Explore cafes around the city and jump straight into the places that match how you want
                  the visit to feel.
                </p>
              </div>
            </div>
            <VenueMap venues={data.mapVenues} height={420} />
          </div>
          <div className="stack">
            <article className="feature-card">
              <header>
                <div>
                  <span className="eyebrow">Find by feel</span>
                  <h3>Search beyond star ratings</h3>
                </div>
                <Sparkles size={18} />
              </header>
              <p>
                Compare places by what actually changes the experience, from WiFi and study fit to
                atmosphere, value, and accessibility.
              </p>
            </article>
            <article className="feature-card">
              <header>
                <div>
                  <span className="eyebrow">Curator picks</span>
                  <h3>Follow voices you trust</h3>
                </div>
                <ShieldCheck size={18} />
              </header>
              <p>
                See recommendations from curators who care about the same details you do, whether that is
                coffee quality, remote work comfort, or interior atmosphere.
              </p>
            </article>
            <article className="feature-card">
              <header>
                <div>
                  <span className="eyebrow">Save time</span>
                  <h3>Get to the right place faster</h3>
                </div>
                <Compass size={18} />
              </header>
              <p>
                Start with a quick browse, switch to the map, or go straight to curator profiles when you
                already know the kind of place you want.
              </p>
            </article>
          </div>
        </section>

        <section className="page-stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Popular right now</span>
              <h2>Places people are opening first</h2>
            </div>
            <Link href="/venues" className="button button-secondary">
              Browse all venues
            </Link>
          </div>
          <div className="card-grid">
            {data.featuredVenues.map((venue) => (
              <article key={venue.venueId} className="list-card">
                <header>
                  <div className="stack">
                    <div className="chip-row">
                      <span className="role-pill">{venue.priceRange ?? "Flexible"}</span>
                      {venue.personalizedScore ? <span className="score-pill">{venue.personalizedScore}/100 fit</span> : null}
                    </div>
                    <h3>{venue.name}</h3>
                  </div>
                </header>
                <p>{venue.description}</p>
                <div className="meta">
                  <span>{venue.city}</span>
                  <span>{venue.reviewCount} reviews</span>
                  <span>{venue.averageRating ? `${venue.averageRating}/5 avg` : "New venue"}</span>
                </div>
                <div className="chip-row">
                  {venue.tagNames.slice(0, 4).map((tagName) => (
                    <span key={tagName} className="chip">
                      {tagName}
                    </span>
                  ))}
                </div>
                <Link href={`/venues/${venue.venueId}`} className="button button-primary">
                  Open venue
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="page-stack">
          <div className="section-heading">
            <div className="stack">
              <span className="eyebrow">Curators</span>
              <h2>Curators to follow</h2>
            </div>
            <Link href="/curators" className="button button-secondary">
              Meet all curators
            </Link>
          </div>
          <div className="card-grid">
            {data.featuredCurators.map((curator) => (
              <article key={curator.userId} className="list-card">
                <header>
                  <div className="stack">
                    <span className="eyebrow">{curator.verifiedAt ? "Verified curator" : "Curator"}</span>
                    <h3>{curator.username}</h3>
                  </div>
                  <span className="score-pill">{curator.reputationScore}/100 reputation</span>
                </header>
                <p>{curator.bio ?? "Curator profile coming soon."}</p>
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
                  <span>{curator.accuracyScore}/100 accuracy</span>
                </div>
                <Link href={`/curators/${curator.userId}`} className="button button-secondary">
                  Open curator
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
