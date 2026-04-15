export const ATTRIBUTE_NAMES = [
  "Food",
  "Service",
  "Atmosphere",
  "WiFi",
  "Study",
  "Accessibility",
  "Value",
  "Cleanliness",
] as const;

export const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"] as const;

export const TAG_TYPES = [
  "Amenity",
  "Atmosphere",
  "Service",
  "Dietary",
  "Accessibility",
] as const;

export const BADGE_TYPES = ["Review", "Check-In", "Social", "Curator"] as const;

export const ROLES = ["regular", "curator", "admin"] as const;

export const ROLE_LABELS = {
  regular: "Regular User",
  curator: "Curator",
  admin: "Admin",
} as const;

export const SESSION_COOKIE_NAME = "cafe_curator_session";
