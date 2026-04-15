import type { ATTRIBUTE_NAMES, ROLES } from "./constants";

export type AttributeName = (typeof ATTRIBUTE_NAMES)[number];
export type AppRole = (typeof ROLES)[number];

export type SessionUser = {
  userId: number;
  username: string;
  email: string;
  role: AppRole;
};

export type VenueCardData = {
  venueId: number;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  priceRange: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  averageRating: number | null;
  averageRecommendation: number | null;
  reviewCount: number;
  tagNames: string[];
  attributeAverages: Partial<Record<AttributeName, number>>;
  personalizedScore: number | null;
  trendScore: number;
  followedCuratorCount: number;
};

export type ReviewRecord = {
  reviewId: number;
  venueId: number;
  userId: number;
  username: string;
  role: AppRole;
  postedAt: string;
  updatedAt: string;
  comment: string | null;
  attributeRatings: Partial<Record<AttributeName, number>>;
};

export type CuratorCardData = {
  userId: number;
  username: string;
  email: string;
  bio: string | null;
  verifiedAt: string | null;
  categories: string[];
  followerCount: number;
  recommendationCount: number;
  averageRecommendation: number | null;
  reputationScore: number;
  accuracyScore: number;
  isFollowed?: boolean;
};

export type RecommendationRecord = {
  curatorId: number;
  curatorName: string;
  recScore: number | null;
  recNote: string | null;
  createdAt: string;
  categories: string[];
};
