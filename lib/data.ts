import type { RowDataPacket } from "mysql2";
import { ATTRIBUTE_NAMES, PRICE_RANGES, ROLE_LABELS } from "./constants";
import { queryOne, queryRows } from "./db";
import type {
  AppRole,
  AttributeName,
  CuratorCardData,
  RecommendationRecord,
  ReviewRecord,
  SessionUser,
  VenueCardData,
} from "./types";

const attributeSet = new Set(ATTRIBUTE_NAMES);

type LoginUserRecord = RowDataPacket & {
  userId: number;
  username: string;
  email: string;
  password: string;
  role: AppRole;
};

type BasicUserRow = RowDataPacket & {
  userId: number;
  username: string;
  email: string;
  role: AppRole;
};

type VenueSummaryRow = RowDataPacket & {
  venueId: number;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  priceRange: string | null;
  description: string | null;
  phone: string | null;
  website: string | null;
  latitude: string | null;
  longitude: string | null;
  averageRating: string | null;
  averageRecommendation: string | null;
  reviewCount: number;
  tagNames: string | null;
  followedCuratorCount: number;
  recommendationCount: number;
};

type AttributeAverageRow = RowDataPacket & {
  venueId: number;
  attributeName: AttributeName;
  averageValue: string;
};

type RecommendationSignalRow = RowDataPacket & {
  venueId: number;
  curatorId: number;
  recScore: number | null;
  isFollowed: number;
  attributeWeights: string | null;
};

type CuratorRow = RowDataPacket & {
  userId: number;
  username: string;
  email: string;
  bio: string | null;
  verifiedAt: string | null;
  categories: string | null;
  followerCount: number;
  recommendationCount: number;
  averageRecommendation: string | null;
  isFollowed: number;
};

type CuratorAccuracyRow = RowDataPacket & {
  curatorId: number;
  alignedAverage: string | null;
};

type ReviewRow = RowDataPacket & {
  reviewId: number;
  venueId: number;
  userId: number;
  username: string;
  role: AppRole;
  postedAt: string;
  updatedAt: string;
  comment: string | null;
};

type ReviewAttributeRow = RowDataPacket & {
  reviewId: number;
  attributeName: AttributeName;
  ratingValue: number;
};

type RecommendationRow = RowDataPacket & {
  curatorId: number;
  curatorName: string;
  recScore: number | null;
  recNote: string | null;
  createdAt: string;
  categories: string | null;
};

type PreferenceRow = RowDataPacket & {
  attributeName: AttributeName;
  weight: number;
};

type SimpleCountRow = RowDataPacket & {
  countValue: number;
};

const asNumber = (value: string | number | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const splitList = (value: string | null, separator = "||") => {
  if (!value) {
    return [];
  }

  return value.split(separator).filter(Boolean);
};

function normalizeRole(role: string): AppRole {
  if (role === "admin" || role === "curator") {
    return role;
  }

  return "regular";
}

function buildAttributeAverageMap(rows: AttributeAverageRow[]) {
  const map = new Map<number, Partial<Record<AttributeName, number>>>();

  for (const row of rows) {
    const entry = map.get(row.venueId) ?? {};
    entry[row.attributeName] = Number(row.averageValue);
    map.set(row.venueId, entry);
  }

  return map;
}

function buildPreferenceMap(rows: PreferenceRow[]) {
  const map: Partial<Record<AttributeName, number>> = {};

  for (const row of rows) {
    if (attributeSet.has(row.attributeName)) {
      map[row.attributeName] = row.weight;
    }
  }

  return map;
}

function computeAttributeWeightedAverage(
  attributeAverages: Partial<Record<AttributeName, number>>,
  preferences: Partial<Record<AttributeName, number>>,
) {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const attribute of ATTRIBUTE_NAMES) {
    const score = attributeAverages[attribute];
    const weight = preferences[attribute];

    if (score && weight) {
      weightedTotal += score * weight;
      weightTotal += weight;
    }
  }

  if (!weightTotal) {
    return null;
  }

  return weightedTotal / weightTotal;
}

function buildCuratorSignalMap(
  venueIds: number[],
  rows: RecommendationSignalRow[],
  preferences: Partial<Record<AttributeName, number>>,
) {
  const map = new Map<number, { followedAverage: number | null; alignedAverage: number | null }>();

  for (const venueId of venueIds) {
    const venueSignals = rows.filter((row) => row.venueId === venueId);

    const followedScores = venueSignals
      .filter((row) => row.isFollowed && row.recScore !== null)
      .map((row) => Number(row.recScore));

    const alignedSignals = venueSignals
      .filter((row) => row.recScore !== null)
      .map((row) => {
        const pairs = splitList(row.attributeWeights, "|").map((segment) => {
          const [attribute, weight] = segment.split(":");
          return {
            attribute: attribute as AttributeName,
            weight: Number(weight),
          };
        });

        let alignmentTotal = 0;
        let alignmentWeight = 0;

        for (const pair of pairs) {
          const preferenceWeight = preferences[pair.attribute] ?? 0;
          if (preferenceWeight > 0) {
            alignmentTotal += preferenceWeight * pair.weight;
            alignmentWeight += 25;
          }
        }

        const alignment = alignmentWeight ? alignmentTotal / alignmentWeight : 0.35;
        return Number(row.recScore) * Math.max(alignment, row.isFollowed ? 0.75 : 0.35);
      });

    map.set(venueId, {
      followedAverage: followedScores.length
        ? followedScores.reduce((sum, value) => sum + value, 0) / followedScores.length
        : null,
      alignedAverage: alignedSignals.length
        ? alignedSignals.reduce((sum, value) => sum + value, 0) / alignedSignals.length
        : null,
    });
  }

  return map;
}

function computeTrendScore(venue: {
  averageRating: number | null;
  averageRecommendation: number | null;
  reviewCount: number;
  followedCuratorCount: number;
}) {
  const ratingPart = (venue.averageRating ?? 0) * 12;
  const recommendationPart = (venue.averageRecommendation ?? 0) * 6;
  const reviewPart = Math.min(venue.reviewCount * 4, 20);
  const followPart = Math.min(venue.followedCuratorCount * 8, 20);

  return clamp(Math.round(ratingPart + recommendationPart + reviewPart + followPart), 0, 100);
}

function computePersonalizedScore(
  attributeAverages: Partial<Record<AttributeName, number>>,
  preferences: Partial<Record<AttributeName, number>>,
  signal: { followedAverage: number | null; alignedAverage: number | null },
) {
  const weightedAverage = computeAttributeWeightedAverage(attributeAverages, preferences);

  if (weightedAverage === null && signal.followedAverage === null && signal.alignedAverage === null) {
    return null;
  }

  const attributePart = (weightedAverage ?? 3.5) * 15;
  const followedPart = (signal.followedAverage ?? 0) * 3;
  const alignmentPart = (signal.alignedAverage ?? 0) * 2;

  return clamp(Math.round(attributePart + followedPart + alignmentPart), 0, 100);
}

function computeCuratorMetrics(row: CuratorRow, accuracy: CuratorAccuracyRow | undefined) {
  const accuracyScore = clamp(
    Math.round(100 - (Number(accuracy?.alignedAverage ?? 1.4) * 20 - 20)),
    35,
    100,
  );
  const verifiedBonus = row.verifiedAt ? 12 : 0;
  const reputationScore = clamp(
    Math.round(accuracyScore * 0.45 + row.followerCount * 6 + row.recommendationCount * 4 + verifiedBonus),
    0,
    100,
  );

  return { accuracyScore, reputationScore };
}

export async function findUserForLogin(role: AppRole, identifier: string) {
  const table =
    role === "admin" ? "`Admin`" : role === "curator" ? "`Curator`" : "`Regular_User`";

  const user = await queryOne<LoginUserRecord[]>(
    `
      SELECT
        u.UserID AS userId,
        u.Username AS username,
        u.Email AS email,
        u.Password AS password,
        ? AS role
      FROM ${table} role_table
      JOIN \`User\` u ON u.UserID = role_table.UserID
      WHERE u.Username = ? OR u.Email = ?
      LIMIT 1
    `,
    [role, identifier, identifier],
  );

  return user;
}

export async function getSessionUserById(userId: number) {
  const row = await queryOne<BasicUserRow[]>(
    `
      SELECT
        u.UserID AS userId,
        u.Username AS username,
        u.Email AS email,
        CASE
          WHEN a.UserID IS NOT NULL THEN 'admin'
          WHEN c.UserID IS NOT NULL THEN 'curator'
          ELSE 'regular'
        END AS role
      FROM \`User\` u
      LEFT JOIN \`Admin\` a ON a.UserID = u.UserID
      LEFT JOIN \`Curator\` c ON c.UserID = u.UserID
      LEFT JOIN \`Regular_User\` ru ON ru.UserID = u.UserID
      WHERE u.UserID = ?
      LIMIT 1
    `,
    [userId],
  );

  if (!row) {
    return null;
  }

  return {
    userId: row.userId,
    username: row.username,
    email: row.email,
    role: normalizeRole(row.role),
  } satisfies SessionUser;
}

export async function getUserPreferences(userId: number) {
  const rows = await queryRows<PreferenceRow[]>(
    `
      SELECT AttributeName AS attributeName, Weight AS weight
      FROM \`User_Attribute_Preference\`
      WHERE UserID = ?
      ORDER BY AttributeName
    `,
    [userId],
  );

  return buildPreferenceMap(rows);
}

export async function getVenueBrowseData(options?: {
  search?: string;
  city?: string;
  priceRange?: string;
  tag?: string;
  userId?: number;
  sort?: "trend" | "personalized" | "rating" | "recent";
}) {
  const search = options?.search?.trim() ?? "";
  const city = options?.city?.trim() ?? "";
  const priceRange = options?.priceRange?.trim() ?? "";
  const tag = options?.tag?.trim() ?? "";

  const venueRows = await queryRows<VenueSummaryRow[]>(
    `
      SELECT
        v.VenueID AS venueId,
        v.Name AS name,
        v.Street AS street,
        v.City AS city,
        v.PostalCode AS postalCode,
        v.PriceRange AS priceRange,
        v.Description AS description,
        v.Phone AS phone,
        v.Website AS website,
        v.Latitude AS latitude,
        v.Longitude AS longitude,
        reviewAgg.averageRating,
        COALESCE(reviewAgg.reviewCount, 0) AS reviewCount,
        recAgg.averageRecommendation,
        COALESCE(recAgg.recommendationCount, 0) AS recommendationCount,
        tagAgg.tagNames,
        COALESCE(followAgg.followedCuratorCount, 0) AS followedCuratorCount
      FROM \`Venue\` v
      LEFT JOIN (
        SELECT
          r.VenueID,
          ROUND(AVG(a.RatingValue), 2) AS averageRating,
          COUNT(DISTINCT r.ReviewID) AS reviewCount
        FROM \`Review\` r
        LEFT JOIN \`Attribute\` a ON a.ReviewID = r.ReviewID
        GROUP BY r.VenueID
      ) reviewAgg ON reviewAgg.VenueID = v.VenueID
      LEFT JOIN (
        SELECT
          VenueID,
          ROUND(AVG(RecScore), 2) AS averageRecommendation,
          COUNT(*) AS recommendationCount
        FROM \`Recommends\`
        GROUP BY VenueID
      ) recAgg ON recAgg.VenueID = v.VenueID
      LEFT JOIN (
        SELECT
          tw.VenueID,
          GROUP_CONCAT(DISTINCT t.TagName ORDER BY t.TagName SEPARATOR '||') AS tagNames
        FROM \`Tagged_With\` tw
        JOIN \`Tag\` t ON t.TagID = tw.TagID
        GROUP BY tw.VenueID
      ) tagAgg ON tagAgg.VenueID = v.VenueID
      LEFT JOIN (
        SELECT
          r.VenueID,
          COUNT(*) AS followedCuratorCount
        FROM \`Recommends\` r
        JOIN \`Follows\` f ON f.CuratorID = r.CuratorID
        WHERE (? IS NOT NULL AND f.FollowerID = ?)
        GROUP BY r.VenueID
      ) followAgg ON followAgg.VenueID = v.VenueID
      WHERE
        (? = '' OR v.Name LIKE CONCAT('%', ?, '%'))
        AND (? = '' OR v.City = ?)
        AND (? = '' OR v.PriceRange = ?)
      ORDER BY v.CreatedAt DESC, v.Name ASC
    `,
    [options?.userId ?? null, options?.userId ?? null, search, search, city, city, priceRange, priceRange],
  );

  const venueIds = venueRows.map((row) => row.venueId);
  const attributeRows = venueIds.length
    ? await queryRows<AttributeAverageRow[]>(
        `
          SELECT
            r.VenueID AS venueId,
            a.AttributeName AS attributeName,
            ROUND(AVG(a.RatingValue), 2) AS averageValue
          FROM \`Review\` r
          JOIN \`Attribute\` a ON a.ReviewID = r.ReviewID
          WHERE r.VenueID IN (?)
          GROUP BY r.VenueID, a.AttributeName
        `,
        [venueIds],
      )
    : [];
  const attributeMap = buildAttributeAverageMap(attributeRows);

  const preferences = options?.userId ? await getUserPreferences(options.userId) : {};
  const recommendationSignals =
    venueIds.length && options?.userId
      ? await queryRows<RecommendationSignalRow[]>(
          `
            SELECT
              r.VenueID AS venueId,
              r.CuratorID AS curatorId,
              r.RecScore AS recScore,
              CASE WHEN f.FollowerID IS NULL THEN 0 ELSE 1 END AS isFollowed,
              GROUP_CONCAT(DISTINCT CONCAT(ca.AttributeName, ':', ca.Weight) SEPARATOR '|') AS attributeWeights
            FROM \`Recommends\` r
            LEFT JOIN \`Follows\` f
              ON f.CuratorID = r.CuratorID
             AND f.FollowerID = ?
            LEFT JOIN \`Specializes_In\` si ON si.CuratorID = r.CuratorID
            LEFT JOIN \`Category_Attribute\` ca ON ca.CategoryID = si.CategoryID
            WHERE r.VenueID IN (?)
            GROUP BY r.VenueID, r.CuratorID, r.RecScore, isFollowed
          `,
          [options.userId, venueIds],
        )
      : [];
  const signalMap = buildCuratorSignalMap(venueIds, recommendationSignals, preferences);

  const mapped = venueRows
    .map((row) => {
      const attributeAverages = attributeMap.get(row.venueId) ?? {};
      const signal = signalMap.get(row.venueId) ?? { followedAverage: null, alignedAverage: null };
      const venue = {
        venueId: row.venueId,
        name: row.name,
        street: row.street,
        city: row.city,
        postalCode: row.postalCode,
        priceRange: row.priceRange,
        description: row.description,
        phone: row.phone,
        website: row.website,
        latitude: asNumber(row.latitude),
        longitude: asNumber(row.longitude),
        averageRating: asNumber(row.averageRating),
        averageRecommendation: asNumber(row.averageRecommendation),
        reviewCount: row.reviewCount,
        tagNames: splitList(row.tagNames),
        attributeAverages,
        personalizedScore: options?.userId ? computePersonalizedScore(attributeAverages, preferences, signal) : null,
        trendScore: computeTrendScore({
          averageRating: asNumber(row.averageRating),
          averageRecommendation: asNumber(row.averageRecommendation),
          reviewCount: row.reviewCount,
          followedCuratorCount: row.followedCuratorCount,
        }),
        followedCuratorCount: row.followedCuratorCount,
      } satisfies VenueCardData;

      return venue;
    })
    .filter((venue) => {
      if (!tag) {
        return true;
      }

      return venue.tagNames.some((tagName) => tagName.toLowerCase().includes(tag.toLowerCase()));
    });

  const sort = options?.sort ?? "trend";

  return mapped.sort((left, right) => {
    if (sort === "rating") {
      return (right.averageRating ?? 0) - (left.averageRating ?? 0);
    }

    if (sort === "personalized") {
      return (right.personalizedScore ?? 0) - (left.personalizedScore ?? 0);
    }

    if (sort === "recent") {
      return right.venueId - left.venueId;
    }

    return right.trendScore - left.trendScore;
  });
}

export async function getVenueDetail(venueId: number, userId?: number) {
  const venueList = await getVenueBrowseData({ userId });
  const venue = venueList.find((entry) => entry.venueId === venueId) ?? null;

  if (!venue) {
    return null;
  }

  const reviewRows = await queryRows<ReviewRow[]>(
    `
      SELECT
        r.ReviewID AS reviewId,
        r.VenueID AS venueId,
        r.UserID AS userId,
        u.Username AS username,
        CASE
          WHEN a.UserID IS NOT NULL THEN 'admin'
          WHEN c.UserID IS NOT NULL THEN 'curator'
          ELSE 'regular'
        END AS role,
        DATE_FORMAT(r.DatePosted, '%Y-%m-%d %H:%i:%s') AS postedAt,
        DATE_FORMAT(r.UpdatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,
        r.Comment AS comment
      FROM \`Review\` r
      JOIN \`User\` u ON u.UserID = r.UserID
      LEFT JOIN \`Admin\` a ON a.UserID = u.UserID
      LEFT JOIN \`Curator\` c ON c.UserID = u.UserID
      WHERE r.VenueID = ?
      ORDER BY r.DatePosted DESC
    `,
    [venueId],
  );

  const reviewIds = reviewRows.map((row) => row.reviewId);
  const reviewAttributeRows = reviewIds.length
    ? await queryRows<ReviewAttributeRow[]>(
        `
          SELECT
            ReviewID AS reviewId,
            AttributeName AS attributeName,
            RatingValue AS ratingValue
          FROM \`Attribute\`
          WHERE ReviewID IN (?)
        `,
        [reviewIds],
      )
    : [];

  const attributeByReview = new Map<number, Partial<Record<AttributeName, number>>>();
  for (const row of reviewAttributeRows) {
    const current = attributeByReview.get(row.reviewId) ?? {};
    current[row.attributeName] = row.ratingValue;
    attributeByReview.set(row.reviewId, current);
  }

  const reviews = reviewRows.map((row) => ({
    reviewId: row.reviewId,
    venueId: row.venueId,
    userId: row.userId,
    username: row.username,
    role: normalizeRole(row.role),
    postedAt: row.postedAt,
    updatedAt: row.updatedAt,
    comment: row.comment,
    attributeRatings: attributeByReview.get(row.reviewId) ?? {},
  })) satisfies ReviewRecord[];

  const recommendationRows = await queryRows<RecommendationRow[]>(
    `
      SELECT
        r.CuratorID AS curatorId,
        u.Username AS curatorName,
        r.RecScore AS recScore,
        r.RecNote AS recNote,
        DATE_FORMAT(r.CreatedAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
        GROUP_CONCAT(DISTINCT ec.CategoryName ORDER BY ec.CategoryName SEPARATOR '||') AS categories
      FROM \`Recommends\` r
      JOIN \`User\` u ON u.UserID = r.CuratorID
      LEFT JOIN \`Specializes_In\` si ON si.CuratorID = r.CuratorID
      LEFT JOIN \`Expertise_Category\` ec ON ec.CategoryID = si.CategoryID
      WHERE r.VenueID = ?
      GROUP BY r.CuratorID, u.Username, r.RecScore, r.RecNote, r.CreatedAt
      ORDER BY r.RecScore DESC, r.CreatedAt DESC
    `,
    [venueId],
  );

  const recommendations = recommendationRows.map((row) => ({
    curatorId: row.curatorId,
    curatorName: row.curatorName,
    recScore: row.recScore,
    recNote: row.recNote,
    createdAt: row.createdAt,
    categories: splitList(row.categories),
  })) satisfies RecommendationRecord[];

  const checkInCountRow = await queryOne<SimpleCountRow[]>(
    "SELECT COUNT(*) AS countValue FROM `Check_In` WHERE VenueID = ?",
    [venueId],
  );

  return {
    venue,
    reviews,
    recommendations,
    checkInCount: checkInCountRow?.countValue ?? 0,
    ownReview: userId ? reviews.find((review) => review.userId === userId) ?? null : null,
  };
}

export async function getCuratorBrowseData(viewerUserId?: number) {
  const curatorRows = await queryRows<CuratorRow[]>(
    `
      SELECT
        u.UserID AS userId,
        u.Username AS username,
        u.Email AS email,
        c.Bio AS bio,
        DATE_FORMAT(c.VerifDate, '%Y-%m-%d') AS verifiedAt,
        GROUP_CONCAT(DISTINCT ec.CategoryName ORDER BY ec.CategoryName SEPARATOR '||') AS categories,
        COALESCE(followerAgg.followerCount, 0) AS followerCount,
        COALESCE(recAgg.recommendationCount, 0) AS recommendationCount,
        recAgg.averageRecommendation,
        CASE WHEN followViewer.FollowerID IS NULL THEN 0 ELSE 1 END AS isFollowed
      FROM \`Curator\` c
      JOIN \`User\` u ON u.UserID = c.UserID
      LEFT JOIN \`Specializes_In\` si ON si.CuratorID = c.UserID
      LEFT JOIN \`Expertise_Category\` ec ON ec.CategoryID = si.CategoryID
      LEFT JOIN (
        SELECT CuratorID, COUNT(*) AS followerCount
        FROM \`Follows\`
        GROUP BY CuratorID
      ) followerAgg ON followerAgg.CuratorID = c.UserID
      LEFT JOIN (
        SELECT CuratorID, COUNT(*) AS recommendationCount, ROUND(AVG(RecScore), 2) AS averageRecommendation
        FROM \`Recommends\`
        GROUP BY CuratorID
      ) recAgg ON recAgg.CuratorID = c.UserID
      LEFT JOIN \`Follows\` followViewer
        ON followViewer.CuratorID = c.UserID
       AND followViewer.FollowerID = ?
      GROUP BY u.UserID, u.Username, u.Email, c.Bio, c.VerifDate, followerAgg.followerCount, recAgg.recommendationCount, recAgg.averageRecommendation, followViewer.FollowerID
      ORDER BY followerAgg.followerCount DESC, u.Username ASC
    `,
    [viewerUserId ?? null],
  );

  const accuracyRows = await queryRows<CuratorAccuracyRow[]>(
    `
      SELECT
        r.CuratorID AS curatorId,
        ROUND(AVG(ABS((r.RecScore / 2) - venueAgg.averageRating)), 2) AS alignedAverage
      FROM \`Recommends\` r
      JOIN (
        SELECT rv.VenueID, AVG(a.RatingValue) AS averageRating
        FROM \`Review\` rv
        JOIN \`Attribute\` a ON a.ReviewID = rv.ReviewID
        GROUP BY rv.VenueID
      ) venueAgg ON venueAgg.VenueID = r.VenueID
      GROUP BY r.CuratorID
    `,
  );
  const accuracyMap = new Map<number, CuratorAccuracyRow>(accuracyRows.map((row) => [row.curatorId, row]));

  return curatorRows.map((row) => {
    const metrics = computeCuratorMetrics(row, accuracyMap.get(row.userId));
    return {
      userId: row.userId,
      username: row.username,
      email: row.email,
      bio: row.bio,
      verifiedAt: row.verifiedAt,
      categories: splitList(row.categories),
      followerCount: row.followerCount,
      recommendationCount: row.recommendationCount,
      averageRecommendation: asNumber(row.averageRecommendation),
      reputationScore: metrics.reputationScore,
      accuracyScore: metrics.accuracyScore,
      isFollowed: Boolean(row.isFollowed),
    } satisfies CuratorCardData;
  });
}

export async function getCuratorDetail(curatorId: number, viewerUserId?: number) {
  const curators = await getCuratorBrowseData(viewerUserId);
  const curator = curators.find((entry) => entry.userId === curatorId) ?? null;

  if (!curator) {
    return null;
  }

  const recommendationRows = await queryRows<RowDataPacket[]>(
    `
      SELECT
        r.VenueID AS venueId,
        v.Name AS venueName,
        r.RecScore AS recScore,
        r.RecNote AS recNote,
        DATE_FORMAT(r.CreatedAt, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM \`Recommends\` r
      JOIN \`Venue\` v ON v.VenueID = r.VenueID
      WHERE r.CuratorID = ?
      ORDER BY r.CreatedAt DESC
    `,
    [curatorId],
  );

  const reviews = await queryRows<ReviewRow[]>(
    `
      SELECT
        r.ReviewID AS reviewId,
        r.VenueID AS venueId,
        r.UserID AS userId,
        u.Username AS username,
        'curator' AS role,
        DATE_FORMAT(r.DatePosted, '%Y-%m-%d %H:%i:%s') AS postedAt,
        DATE_FORMAT(r.UpdatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,
        r.Comment AS comment
      FROM \`Review\` r
      JOIN \`User\` u ON u.UserID = r.UserID
      WHERE r.UserID = ?
      ORDER BY r.DatePosted DESC
      LIMIT 5
    `,
    [curatorId],
  );

  return {
    curator,
    recommendations: recommendationRows,
    reviews,
  };
}

export async function getLandingData(userId?: number) {
  const [venues, curators] = await Promise.all([
    getVenueBrowseData({ userId, sort: userId ? "personalized" : "trend" }),
    getCuratorBrowseData(userId),
  ]);

  return {
    featuredVenues: venues.slice(0, 4),
    mapVenues: venues.slice(0, 6),
    featuredCurators: curators.slice(0, 3),
  };
}

export async function getRegularDashboardData(userId: number) {
  const [profile, reviewCount, checkInCount, followCount, badgeCount, preferences, followedCurators, checkIns, savedFeed] =
    await Promise.all([
      queryOne<RowDataPacket[]>(
        `
          SELECT
            u.UserID AS userId,
            u.Username AS username,
            u.Email AS email,
            u.RegDate AS regDate,
            ru.Level AS level
          FROM \`User\` u
          JOIN \`Regular_User\` ru ON ru.UserID = u.UserID
          WHERE u.UserID = ?
        `,
        [userId],
      ),
      queryOne<SimpleCountRow[]>("SELECT COUNT(*) AS countValue FROM `Review` WHERE UserID = ?", [userId]),
      queryOne<SimpleCountRow[]>("SELECT COUNT(*) AS countValue FROM `Check_In` WHERE UserID = ?", [userId]),
      queryOne<SimpleCountRow[]>("SELECT COUNT(*) AS countValue FROM `Follows` WHERE FollowerID = ?", [userId]),
      queryOne<SimpleCountRow[]>("SELECT COUNT(*) AS countValue FROM `Earns` WHERE UserID = ?", [userId]),
      getUserPreferences(userId),
      getCuratorBrowseData(userId),
      queryRows<RowDataPacket[]>(
        `
          SELECT
            DATE_FORMAT(ci.CheckInTime, '%Y-%m-%d %H:%i:%s') AS checkInTime,
            ci.Notes AS notes,
            v.VenueID AS venueId,
            v.Name AS venueName
          FROM \`Check_In\` ci
          JOIN \`Venue\` v ON v.VenueID = ci.VenueID
          WHERE ci.UserID = ?
          ORDER BY ci.CheckInTime DESC
          LIMIT 8
        `,
        [userId],
      ),
      getVenueBrowseData({ userId, sort: "personalized" }),
    ]);

  const earnedBadges = await queryRows<RowDataPacket[]>(
    `
      SELECT
        b.BadgeID AS badgeId,
        b.BadgeType AS badgeType,
        b.Name AS name,
        b.Description AS description,
        DATE_FORMAT(e.DateEarned, '%Y-%m-%d') AS dateEarned
      FROM \`Earns\` e
      JOIN \`Badge\` b ON b.BadgeID = e.BadgeID
      WHERE e.UserID = ?
      ORDER BY e.DateEarned DESC
    `,
    [userId],
  );

  return {
    profile,
    stats: {
      reviewCount: reviewCount?.countValue ?? 0,
      checkInCount: checkInCount?.countValue ?? 0,
      followCount: followCount?.countValue ?? 0,
      badgeCount: badgeCount?.countValue ?? 0,
    },
    preferences,
    followedCurators: followedCurators.filter((curator) => curator.isFollowed),
    recentCheckIns: checkIns,
    earnedBadges,
    personalizedFeed: savedFeed.slice(0, 6),
  };
}

export async function getCuratorDashboardData(userId: number) {
  const [curatorDetail, recommendations, reviews, followers, submissions, categories] = await Promise.all([
    getCuratorDetail(userId),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          r.VenueID AS venueId,
          v.Name AS venueName,
          r.RecScore AS recScore,
          r.RecNote AS recNote,
          DATE_FORMAT(r.CreatedAt, '%Y-%m-%d %H:%i:%s') AS createdAt
        FROM \`Recommends\` r
        JOIN \`Venue\` v ON v.VenueID = r.VenueID
        WHERE r.CuratorID = ?
        ORDER BY r.CreatedAt DESC
      `,
      [userId],
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          r.ReviewID AS reviewId,
          v.Name AS venueName,
          DATE_FORMAT(r.DatePosted, '%Y-%m-%d %H:%i:%s') AS postedAt,
          r.Comment AS comment
        FROM \`Review\` r
        JOIN \`Venue\` v ON v.VenueID = r.VenueID
        WHERE r.UserID = ?
        ORDER BY r.DatePosted DESC
      `,
      [userId],
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          u.UserID AS userId,
          u.Username AS username,
          u.Email AS email,
          DATE_FORMAT(f.FollowedAt, '%Y-%m-%d %H:%i:%s') AS followedAt
        FROM \`Follows\` f
        JOIN \`User\` u ON u.UserID = f.FollowerID
        WHERE f.CuratorID = ?
        ORDER BY f.FollowedAt DESC
      `,
      [userId],
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          SubmissionID AS submissionId,
          Name AS name,
          City AS city,
          Status AS status,
          DATE_FORMAT(SubmittedAt, '%Y-%m-%d %H:%i:%s') AS submittedAt
        FROM \`Venue_Submission\`
        WHERE CuratorID = ?
        ORDER BY SubmittedAt DESC
      `,
      [userId],
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          ec.CategoryID AS categoryId,
          ec.CategoryName AS categoryName,
          ec.Description AS description,
          CASE WHEN si.CuratorID IS NULL THEN 0 ELSE 1 END AS isSelected
        FROM \`Expertise_Category\` ec
        LEFT JOIN \`Specializes_In\` si
          ON si.CategoryID = ec.CategoryID
         AND si.CuratorID = ?
        ORDER BY ec.CategoryName ASC
      `,
      [userId],
    ),
  ]);

  return {
    curator: curatorDetail?.curator ?? null,
    recentRecommendations: recommendations,
    recentReviews: reviews,
    followers,
    submissions,
    categories,
  };
}

export async function getAdminDashboardData() {
  const [users, venues, curators, categories, tags, badges, pendingSubmissions, recentReviews] = await Promise.all([
    queryRows<RowDataPacket[]>(
      `
        SELECT
          u.UserID AS userId,
          u.Username AS username,
          u.Email AS email,
          u.RegDate AS regDate,
          CASE
            WHEN a.UserID IS NOT NULL THEN 'Admin'
            WHEN c.UserID IS NOT NULL THEN 'Curator'
            ELSE 'Regular User'
          END AS roleLabel,
          DATE_FORMAT(c.VerifDate, '%Y-%m-%d') AS verifiedAt
        FROM \`User\` u
        LEFT JOIN \`Admin\` a ON a.UserID = u.UserID
        LEFT JOIN \`Curator\` c ON c.UserID = u.UserID
        ORDER BY u.RegDate DESC, u.UserID DESC
      `,
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          VenueID AS venueId,
          Name AS name,
          City AS city,
          PriceRange AS priceRange,
          Website AS website
        FROM \`Venue\`
        ORDER BY Name ASC
      `,
    ),
    getCuratorBrowseData(),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          ec.CategoryID AS categoryId,
          ec.CategoryName AS categoryName,
          ec.Description AS description,
          GROUP_CONCAT(DISTINCT CONCAT(ca.AttributeName, ' (', ca.Weight, ')') ORDER BY ca.AttributeName SEPARATOR ', ') AS attributeWeights
        FROM \`Expertise_Category\` ec
        LEFT JOIN \`Category_Attribute\` ca ON ca.CategoryID = ec.CategoryID
        GROUP BY ec.CategoryID, ec.CategoryName, ec.Description
        ORDER BY ec.CategoryName ASC
      `,
    ),
    queryRows<RowDataPacket[]>(
      "SELECT TagID AS tagId, TagName AS tagName, TagType AS tagType FROM `Tag` ORDER BY TagName ASC",
    ),
    queryRows<RowDataPacket[]>(
      "SELECT BadgeID AS badgeId, BadgeType AS badgeType, Name AS name, Description AS description, PtsRequired AS ptsRequired FROM `Badge` ORDER BY BadgeType, PtsRequired, Name",
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          vs.SubmissionID AS submissionId,
          vs.Name AS name,
          vs.City AS city,
          vs.PriceRange AS priceRange,
          vs.Status AS status,
          u.Username AS curatorName,
          DATE_FORMAT(vs.SubmittedAt, '%Y-%m-%d %H:%i:%s') AS submittedAt
        FROM \`Venue_Submission\` vs
        JOIN \`User\` u ON u.UserID = vs.CuratorID
        ORDER BY vs.SubmittedAt DESC
      `,
    ),
    queryRows<RowDataPacket[]>(
      `
        SELECT
          r.ReviewID AS reviewId,
          u.Username AS username,
          v.Name AS venueName,
          DATE_FORMAT(r.DatePosted, '%Y-%m-%d %H:%i:%s') AS postedAt,
          r.Comment AS comment
        FROM \`Review\` r
        JOIN \`User\` u ON u.UserID = r.UserID
        JOIN \`Venue\` v ON v.VenueID = r.VenueID
        ORDER BY r.DatePosted DESC
        LIMIT 12
      `,
    ),
  ]);

  return {
    users,
    venues,
    curators,
    categories,
    tags,
    badges,
    pendingSubmissions,
    recentReviews,
  };
}

export function getRolePresentation(role: AppRole) {
  return ROLE_LABELS[role];
}

export function getPriceRangeOptions() {
  return [...PRICE_RANGES];
}
