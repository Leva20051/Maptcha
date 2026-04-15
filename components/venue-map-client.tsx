"use client";

import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { VenueCardData } from "@/lib/types";

type VenueMapClientProps = {
  venues: VenueCardData[];
  height?: number;
};

const fallbackCenter: [number, number] = [51.0447, -114.0719];

export default function VenueMapClient({ venues, height = 360 }: VenueMapClientProps) {
  const visibleVenues = venues.filter((venue) => venue.latitude !== null && venue.longitude !== null);
  const center =
    visibleVenues.length > 0
      ? ([visibleVenues[0].latitude!, visibleVenues[0].longitude!] as [number, number])
      : fallbackCenter;

  return (
    <div className="map-frame" style={{ height }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="venue-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visibleVenues.map((venue) => (
          <CircleMarker
            key={venue.venueId}
            center={[venue.latitude!, venue.longitude!]}
            radius={10}
            pathOptions={{
              color: "#18392b",
              fillColor: venue.personalizedScore ? "#d2743a" : "#3d8b66",
              fillOpacity: 0.95,
              weight: 2,
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{venue.name}</strong>
                <p>
                  {venue.city} · {venue.priceRange ?? "Unpriced"}
                </p>
                <p>{venue.tagNames.slice(0, 3).join(", ") || "No tags yet"}</p>
                <Link href={`/venues/${venue.venueId}`}>Open venue</Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
