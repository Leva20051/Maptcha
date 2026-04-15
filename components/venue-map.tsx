"use client";

import dynamic from "next/dynamic";
import type { VenueCardData } from "@/lib/types";

type VenueMapProps = {
  venues: VenueCardData[];
  height?: number;
};

const VenueMapClient = dynamic(() => import("./venue-map-client"), {
  ssr: false,
  loading: () => <div className="map-frame" style={{ height: 360 }} />,
});

export default function VenueMap({ venues, height = 360 }: VenueMapProps) {
  return <VenueMapClient venues={venues} height={height} />;
}
