"use server";

import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getRoleHome, requireRole, requireSession } from "./auth";
import { ATTRIBUTE_NAMES, BADGE_TYPES, PRICE_RANGES, TAG_TYPES } from "./constants";
import { execute, queryOne, withTransaction } from "./db";
import { findUserForLogin, getSessionUserById } from "./data";
import { hashPassword, verifyPassword } from "./security";
import type { AppRole, AttributeName } from "./types";

const getText = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const getOptionalText = (formData: FormData, key: string) => {
  const value = getText(formData, key);
  return value.length ? value : null;
};

const getRequiredText = (formData: FormData, key: string, label: string) => {
  const value = getText(formData, key);

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

const getOptionalNumber = (formData: FormData, key: string) => {
  const value = getText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRequiredNumber = (formData: FormData, key: string, label: string) => {
  const value = getOptionalNumber(formData, key);

  if (value === null) {
    throw new Error(`${label} is required.`);
  }

  return value;
};

const isValidPriceRange = (value: string | null) => value === null || PRICE_RANGES.includes(value as (typeof PRICE_RANGES)[number]);
const isValidTagType = (value: string) => TAG_TYPES.includes(value as (typeof TAG_TYPES)[number]);
const isValidBadgeType = (value: string) => BADGE_TYPES.includes(value as (typeof BADGE_TYPES)[number]);

async function ensureUniqueUserFields(connection: PoolConnection, username: string, email: string, excludeUserId?: number) {
  const [rows] = await connection.query<RowDataPacket[]>(
    `
      SELECT UserID
      FROM \`User\`
      WHERE (Username = ? OR Email = ?)
        AND (? IS NULL OR UserID <> ?)
      LIMIT 1
    `,
    [username, email, excludeUserId ?? null, excludeUserId ?? null],
  );

  if (rows.length) {
    throw new Error("That username or email is already in use.");
  }
}

async function createDefaultPreferences(connection: PoolConnection, userId: number) {
  for (const attribute of ATTRIBUTE_NAMES) {
    await connection.execute(
      "INSERT INTO `User_Attribute_Preference` (`UserID`, `AttributeName`, `Weight`) VALUES (?, ?, 3)",
      [userId, attribute],
    );
  }
}

async function refreshSessionForUser(userId: number) {
  const user = await getSessionUserById(userId);

  if (user) {
    await createSession(user);
  }
}

async function syncUserProgress(connection: PoolConnection, userId: number) {
  const [[regularRow]] = await connection.query<RowDataPacket[]>(
    "SELECT UserID FROM `Regular_User` WHERE UserID = ? LIMIT 1",
    [userId],
  );
  const [[curatorRow]] = await connection.query<RowDataPacket[]>(
    "SELECT UserID FROM `Curator` WHERE UserID = ? LIMIT 1",
    [userId],
  );

  const [[reviewRow]] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS countValue FROM `Review` WHERE UserID = ?",
    [userId],
  );
  const [[checkInRow]] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS countValue FROM `Check_In` WHERE UserID = ?",
    [userId],
  );
  const [[followRow]] = await connection.query<RowDataPacket[]>(
    `
      SELECT COUNT(*) AS countValue
      FROM \`Follows\`
      WHERE FollowerID = ? OR CuratorID = ?
    `,
    [userId, userId],
  );
  const [[recRow]] = await connection.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS countValue FROM `Recommends` WHERE CuratorID = ?",
    [userId],
  );

  const reviewCount = Number(reviewRow?.countValue ?? 0);
  const checkInCount = Number(checkInRow?.countValue ?? 0);
  const socialCount = Number(followRow?.countValue ?? 0);
  const curatorCount = Number(recRow?.countValue ?? 0);

  if (regularRow) {
    const points = reviewCount * 4 + checkInCount * 2 + socialCount;
    const level = Math.max(1, Math.floor(points / 5) + 1);
    await connection.execute("UPDATE `Regular_User` SET `Level` = ? WHERE `UserID` = ?", [level, userId]);
  }

  const [badges] = await connection.query<RowDataPacket[]>(
    "SELECT BadgeID, BadgeType, PtsRequired FROM `Badge` ORDER BY BadgeID",
  );

  for (const badge of badges) {
    let progress = 0;

    if (badge.BadgeType === "Review") {
      progress = reviewCount;
    } else if (badge.BadgeType === "Check-In") {
      progress = checkInCount;
    } else if (badge.BadgeType === "Social") {
      progress = socialCount;
    } else if (badge.BadgeType === "Curator" && curatorRow) {
      progress = curatorCount;
    }

    const required = badge.PtsRequired === 0 ? 1 : Number(badge.PtsRequired);

    if (progress >= required) {
      await connection.execute(
        `
          INSERT IGNORE INTO \`Earns\` (\`UserID\`, \`BadgeID\`, \`DateEarned\`)
          VALUES (?, ?, CURRENT_DATE())
        `,
        [userId, badge.BadgeID],
      );
    }
  }
}

function extractAttributeRatings(formData: FormData) {
  const ratings: Array<{ attribute: AttributeName; rating: number }> = [];

  for (const attribute of ATTRIBUTE_NAMES) {
    const key = `rating_${attribute}`;
    const rating = getOptionalNumber(formData, key);

    if (rating !== null) {
      if (rating < 1 || rating > 5) {
        throw new Error(`${attribute} rating must be between 1 and 5.`);
      }

      ratings.push({ attribute, rating });
    }
  }

  if (!ratings.length) {
    throw new Error("Add at least one attribute rating.");
  }

  return ratings;
}

function touchCorePaths() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/venues");
  revalidatePath("/account");
  revalidatePath("/curators");
  revalidatePath("/curator-studio");
  revalidatePath("/admin");
}

async function handleLogin(role: AppRole, formData: FormData) {
  const identifier = getRequiredText(formData, "identifier", "Username or email");
  const password = getRequiredText(formData, "password", "Password");
  const user = await findUserForLogin(role, identifier);

  if (!user || !verifyPassword(password, user.password)) {
    throw new Error("Invalid credentials.");
  }

  await createSession({
    userId: user.userId,
    username: user.username,
    email: user.email,
    role,
  });

  redirect(await getRoleHome(role));
}

export async function loginRegularAction(formData: FormData) {
  await handleLogin("regular", formData);
}

export async function loginCuratorAction(formData: FormData) {
  await handleLogin("curator", formData);
}

export async function loginAdminAction(formData: FormData) {
  await handleLogin("admin", formData);
}

export async function registerRegularAction(formData: FormData) {
  const username = getRequiredText(formData, "username", "Username");
  const email = getRequiredText(formData, "email", "Email");
  const password = getRequiredText(formData, "password", "Password");

  const userId = await withTransaction(async (connection) => {
    await ensureUniqueUserFields(connection, username, email);

    const [userResult] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO \`User\` (\`Username\`, \`Email\`, \`Password\`, \`RegDate\`)
        VALUES (?, ?, ?, CURRENT_DATE())
      `,
      [username, email, hashPassword(password)],
    );

    await connection.execute("INSERT INTO `Regular_User` (`UserID`, `Level`) VALUES (?, 1)", [userResult.insertId]);
    await createDefaultPreferences(connection, userResult.insertId);
    return userResult.insertId;
  });

  const user = await getSessionUserById(userId);
  if (!user) {
    throw new Error("Could not create the account.");
  }

  await createSession(user);
  touchCorePaths();
  redirect("/dashboard");
}

export async function registerCuratorAction(formData: FormData) {
  const username = getRequiredText(formData, "username", "Username");
  const email = getRequiredText(formData, "email", "Email");
  const password = getRequiredText(formData, "password", "Password");
  const bio = getOptionalText(formData, "bio");

  const userId = await withTransaction(async (connection) => {
    await ensureUniqueUserFields(connection, username, email);

    const [adminRows] = await connection.query<RowDataPacket[]>(
      "SELECT UserID FROM `Admin` ORDER BY UserID ASC LIMIT 1",
    );

    if (!adminRows.length) {
      throw new Error("No admin account exists to attach curator verification.");
    }

    const [userResult] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO \`User\` (\`Username\`, \`Email\`, \`Password\`, \`RegDate\`)
        VALUES (?, ?, ?, CURRENT_DATE())
      `,
      [username, email, hashPassword(password)],
    );

    await connection.execute(
      `
        INSERT INTO \`Curator\` (\`UserID\`, \`AdminID\`, \`VerifDate\`, \`Bio\`)
        VALUES (?, ?, NULL, ?)
      `,
      [userResult.insertId, adminRows[0].UserID, bio],
    );

    return userResult.insertId;
  });

  const user = await getSessionUserById(userId);
  if (!user) {
    throw new Error("Could not create the account.");
  }

  await createSession(user);
  touchCorePaths();
  redirect("/curator-studio");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function updateRegularProfileAction(formData: FormData) {
  const session = await requireRole("regular");
  const username = getRequiredText(formData, "username", "Username");
  const email = getRequiredText(formData, "email", "Email");

  await withTransaction(async (connection) => {
    await ensureUniqueUserFields(connection, username, email, session.userId);
    await connection.execute("UPDATE `User` SET `Username` = ?, `Email` = ? WHERE `UserID` = ?", [
      username,
      email,
      session.userId,
    ]);
  });

  await refreshSessionForUser(session.userId);
  touchCorePaths();
  redirect("/account");
}

export async function updateAdminProfileAction(formData: FormData) {
  const session = await requireRole("admin");
  const username = getRequiredText(formData, "username", "Username");
  const email = getRequiredText(formData, "email", "Email");

  await withTransaction(async (connection) => {
    await ensureUniqueUserFields(connection, username, email, session.userId);
    await connection.execute("UPDATE `User` SET `Username` = ?, `Email` = ? WHERE `UserID` = ?", [
      username,
      email,
      session.userId,
    ]);
  });

  await refreshSessionForUser(session.userId);
  touchCorePaths();
  redirect("/account");
}

export async function savePreferencesAction(formData: FormData) {
  const session = await requireRole("regular");

  await withTransaction(async (connection) => {
    for (const attribute of ATTRIBUTE_NAMES) {
      const weight = getRequiredNumber(formData, `pref_${attribute}`, `${attribute} preference`);

      if (weight < 1 || weight > 5) {
        throw new Error("Preferences must be between 1 and 5.");
      }

      await connection.execute(
        `
          INSERT INTO \`User_Attribute_Preference\` (\`UserID\`, \`AttributeName\`, \`Weight\`)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE \`Weight\` = VALUES(\`Weight\`)
        `,
        [session.userId, attribute, weight],
      );
    }
  });

  touchCorePaths();
  redirect("/dashboard");
}

export async function followCuratorAction(formData: FormData) {
  const session = await requireRole("regular");
  const curatorId = getRequiredNumber(formData, "curatorId", "Curator");

  await withTransaction(async (connection) => {
    await connection.execute(
      "INSERT IGNORE INTO `Follows` (`FollowerID`, `CuratorID`) VALUES (?, ?)",
      [session.userId, curatorId],
    );
    await syncUserProgress(connection, session.userId);
    await syncUserProgress(connection, curatorId);
  });

  touchCorePaths();
}

export async function unfollowCuratorAction(formData: FormData) {
  const session = await requireRole("regular");
  const curatorId = getRequiredNumber(formData, "curatorId", "Curator");

  await withTransaction(async (connection) => {
    await connection.execute("DELETE FROM `Follows` WHERE `FollowerID` = ? AND `CuratorID` = ?", [
      session.userId,
      curatorId,
    ]);
    await syncUserProgress(connection, session.userId);
    await syncUserProgress(connection, curatorId);
  });

  touchCorePaths();
}

export async function saveReviewAction(formData: FormData) {
  const session = await requireSession();
  const venueId = getRequiredNumber(formData, "venueId", "Venue");
  const reviewId = getOptionalNumber(formData, "reviewId");
  const comment = getOptionalText(formData, "comment");
  const ratings = extractAttributeRatings(formData);

  await withTransaction(async (connection) => {
    let activeReviewId = reviewId;

    if (activeReviewId) {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT ReviewID FROM `Review` WHERE `ReviewID` = ? AND `UserID` = ? LIMIT 1",
        [activeReviewId, session.userId],
      );

      if (!rows.length) {
        throw new Error("You can only edit your own review.");
      }

      await connection.execute(
        "UPDATE `Review` SET `Comment` = ?, `UpdatedAt` = CURRENT_TIMESTAMP WHERE `ReviewID` = ?",
        [comment, activeReviewId],
      );
      await connection.execute("DELETE FROM `Attribute` WHERE `ReviewID` = ?", [activeReviewId]);
    } else {
      const [reviewResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO `Review` (`UserID`, `VenueID`, `Comment`) VALUES (?, ?, ?)",
        [session.userId, venueId, comment],
      );
      activeReviewId = reviewResult.insertId;
    }

    for (const rating of ratings) {
      await connection.execute(
        `
          INSERT INTO \`Attribute\` (\`ReviewID\`, \`AttributeName\`, \`RatingValue\`)
          VALUES (?, ?, ?)
        `,
        [activeReviewId, rating.attribute, rating.rating],
      );
    }

    await syncUserProgress(connection, session.userId);
  });

  touchCorePaths();
  revalidatePath(`/venues/${venueId}`);
}

export async function deleteOwnReviewAction(formData: FormData) {
  const session = await requireSession();
  const reviewId = getRequiredNumber(formData, "reviewId", "Review");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");

  await withTransaction(async (connection) => {
    await connection.execute("DELETE FROM `Review` WHERE `ReviewID` = ? AND `UserID` = ?", [
      reviewId,
      session.userId,
    ]);
    await syncUserProgress(connection, session.userId);
  });

  touchCorePaths();
  revalidatePath(`/venues/${venueId}`);
}

export async function createCheckInAction(formData: FormData) {
  const session = await requireRole("regular");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");
  const notes = getOptionalText(formData, "notes");

  await withTransaction(async (connection) => {
    await connection.execute("INSERT INTO `Check_In` (`UserID`, `VenueID`, `Notes`) VALUES (?, ?, ?)", [
      session.userId,
      venueId,
      notes,
    ]);
    await syncUserProgress(connection, session.userId);
  });

  touchCorePaths();
  revalidatePath(`/venues/${venueId}`);
}

export async function updateCuratorProfileAction(formData: FormData) {
  const session = await requireRole("curator");
  const username = getRequiredText(formData, "username", "Username");
  const email = getRequiredText(formData, "email", "Email");
  const bio = getOptionalText(formData, "bio");

  await withTransaction(async (connection) => {
    await ensureUniqueUserFields(connection, username, email, session.userId);
    await connection.execute("UPDATE `User` SET `Username` = ?, `Email` = ? WHERE `UserID` = ?", [
      username,
      email,
      session.userId,
    ]);
    await connection.execute("UPDATE `Curator` SET `Bio` = ? WHERE `UserID` = ?", [bio, session.userId]);
  });

  await refreshSessionForUser(session.userId);
  touchCorePaths();
  redirect("/curator-studio");
}

export async function toggleCuratorCategoryAction(formData: FormData) {
  const session = await requireRole("curator");
  const categoryId = getRequiredNumber(formData, "categoryId", "Category");
  const enabled = getRequiredText(formData, "enabled", "Selection");

  await withTransaction(async (connection) => {
    if (enabled === "1") {
      await connection.execute(
        "INSERT IGNORE INTO `Specializes_In` (`CuratorID`, `CategoryID`) VALUES (?, ?)",
        [session.userId, categoryId],
      );
    } else {
      await connection.execute(
        "DELETE FROM `Specializes_In` WHERE `CuratorID` = ? AND `CategoryID` = ?",
        [session.userId, categoryId],
      );
    }
  });

  touchCorePaths();
}

export async function saveRecommendationAction(formData: FormData) {
  const session = await requireRole("curator");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");
  const recScore = getRequiredNumber(formData, "recScore", "Recommendation score");
  const recNote = getOptionalText(formData, "recNote");

  if (recScore < 1 || recScore > 10) {
    throw new Error("Recommendation score must be between 1 and 10.");
  }

  await withTransaction(async (connection) => {
    await connection.execute(
      `
        INSERT INTO \`Recommends\` (\`CuratorID\`, \`VenueID\`, \`RecNote\`, \`RecScore\`)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          \`RecNote\` = VALUES(\`RecNote\`),
          \`RecScore\` = VALUES(\`RecScore\`)
      `,
      [session.userId, venueId, recNote, recScore],
    );
    await syncUserProgress(connection, session.userId);
  });

  touchCorePaths();
  revalidatePath(`/venues/${venueId}`);
}

export async function deleteRecommendationAction(formData: FormData) {
  const session = await requireRole("curator");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");

  await withTransaction(async (connection) => {
    await connection.execute("DELETE FROM `Recommends` WHERE `CuratorID` = ? AND `VenueID` = ?", [
      session.userId,
      venueId,
    ]);
    await syncUserProgress(connection, session.userId);
  });

  touchCorePaths();
  revalidatePath(`/venues/${venueId}`);
}

export async function submitVenueAction(formData: FormData) {
  const session = await requireRole("curator");
  const name = getRequiredText(formData, "name", "Venue name");
  const street = getRequiredText(formData, "street", "Street");
  const city = getRequiredText(formData, "city", "City");
  const postalCode = getRequiredText(formData, "postalCode", "Postal code");
  const priceRange = getOptionalText(formData, "priceRange");
  const description = getOptionalText(formData, "description");
  const phone = getOptionalText(formData, "phone");
  const website = getOptionalText(formData, "website");
  const latitude = getOptionalNumber(formData, "latitude");
  const longitude = getOptionalNumber(formData, "longitude");

  if (!isValidPriceRange(priceRange)) {
    throw new Error("Invalid price range.");
  }

  await execute(
    `
      INSERT INTO \`Venue_Submission\`
        (\`CuratorID\`, \`Name\`, \`Street\`, \`City\`, \`PostalCode\`, \`PriceRange\`, \`Description\`, \`Phone\`, \`Website\`, \`Latitude\`, \`Longitude\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [session.userId, name, street, city, postalCode, priceRange, description, phone, website, latitude, longitude],
  );

  touchCorePaths();
  redirect("/curator-studio");
}

export async function verifyCuratorAction(formData: FormData) {
  const session = await requireRole("admin");
  const curatorId = getRequiredNumber(formData, "curatorId", "Curator");

  await execute(
    "UPDATE `Curator` SET `AdminID` = ?, `VerifDate` = CURRENT_DATE() WHERE `UserID` = ?",
    [session.userId, curatorId],
  );

  touchCorePaths();
}

export async function saveVenueAction(formData: FormData) {
  await requireRole("admin");
  const venueId = getOptionalNumber(formData, "venueId");
  const name = getRequiredText(formData, "name", "Venue name");
  const street = getRequiredText(formData, "street", "Street");
  const city = getRequiredText(formData, "city", "City");
  const postalCode = getRequiredText(formData, "postalCode", "Postal code");
  const priceRange = getOptionalText(formData, "priceRange");
  const description = getOptionalText(formData, "description");
  const phone = getOptionalText(formData, "phone");
  const website = getOptionalText(formData, "website");
  const latitude = getOptionalNumber(formData, "latitude");
  const longitude = getOptionalNumber(formData, "longitude");

  if (!isValidPriceRange(priceRange)) {
    throw new Error("Invalid price range.");
  }

  if (venueId) {
    await execute(
      `
        UPDATE \`Venue\`
        SET
          \`Name\` = ?,
          \`Street\` = ?,
          \`City\` = ?,
          \`PostalCode\` = ?,
          \`PriceRange\` = ?,
          \`Description\` = ?,
          \`Phone\` = ?,
          \`Website\` = ?,
          \`Latitude\` = ?,
          \`Longitude\` = ?
        WHERE \`VenueID\` = ?
      `,
      [name, street, city, postalCode, priceRange, description, phone, website, latitude, longitude, venueId],
    );
  } else {
    await execute(
      `
        INSERT INTO \`Venue\`
          (\`Name\`, \`Street\`, \`City\`, \`PostalCode\`, \`PriceRange\`, \`Description\`, \`Phone\`, \`Website\`, \`Latitude\`, \`Longitude\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [name, street, city, postalCode, priceRange, description, phone, website, latitude, longitude],
    );
  }

  touchCorePaths();
  redirect("/admin");
}

export async function deleteVenueAction(formData: FormData) {
  await requireRole("admin");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");
  await execute("DELETE FROM `Venue` WHERE `VenueID` = ?", [venueId]);
  touchCorePaths();
}

export async function saveCategoryAction(formData: FormData) {
  const session = await requireRole("admin");
  const categoryId = getOptionalNumber(formData, "categoryId");
  const categoryName = getRequiredText(formData, "categoryName", "Category name");
  const description = getOptionalText(formData, "description");

  if (categoryId) {
    await execute(
      "UPDATE `Expertise_Category` SET `CategoryName` = ?, `Description` = ? WHERE `CategoryID` = ?",
      [categoryName, description, categoryId],
    );
  } else {
    await execute(
      "INSERT INTO `Expertise_Category` (`AdminID`, `CategoryName`, `Description`) VALUES (?, ?, ?)",
      [session.userId, categoryName, description],
    );
  }

  touchCorePaths();
}

export async function saveCategoryAttributeAction(formData: FormData) {
  await requireRole("admin");
  const categoryId = getRequiredNumber(formData, "categoryId", "Category");
  const attributeName = getRequiredText(formData, "attributeName", "Attribute");
  const weight = getRequiredNumber(formData, "weight", "Weight");

  if (!ATTRIBUTE_NAMES.includes(attributeName as AttributeName)) {
    throw new Error("Invalid attribute name.");
  }

  if (weight < 1 || weight > 5) {
    throw new Error("Weight must be between 1 and 5.");
  }

  await execute(
    `
      INSERT INTO \`Category_Attribute\` (\`CategoryID\`, \`AttributeName\`, \`Weight\`)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE \`Weight\` = VALUES(\`Weight\`)
    `,
    [categoryId, attributeName, weight],
  );

  touchCorePaths();
}

export async function adminAssignCuratorCategoryAction(formData: FormData) {
  await requireRole("admin");
  const curatorId = getRequiredNumber(formData, "curatorId", "Curator");
  const categoryId = getRequiredNumber(formData, "categoryId", "Category");
  const enabled = getRequiredText(formData, "enabled", "Selection");

  if (enabled === "1") {
    await execute(
      "INSERT IGNORE INTO `Specializes_In` (`CuratorID`, `CategoryID`) VALUES (?, ?)",
      [curatorId, categoryId],
    );
  } else {
    await execute("DELETE FROM `Specializes_In` WHERE `CuratorID` = ? AND `CategoryID` = ?", [
      curatorId,
      categoryId,
    ]);
  }

  touchCorePaths();
}

export async function saveTagAction(formData: FormData) {
  await requireRole("admin");
  const tagId = getOptionalNumber(formData, "tagId");
  const tagName = getRequiredText(formData, "tagName", "Tag name");
  const tagType = getRequiredText(formData, "tagType", "Tag type");

  if (!isValidTagType(tagType)) {
    throw new Error("Invalid tag type.");
  }

  if (tagId) {
    await execute("UPDATE `Tag` SET `TagName` = ?, `TagType` = ? WHERE `TagID` = ?", [tagName, tagType, tagId]);
  } else {
    await execute("INSERT INTO `Tag` (`TagName`, `TagType`) VALUES (?, ?)", [tagName, tagType]);
  }

  touchCorePaths();
}

export async function assignTagToVenueAction(formData: FormData) {
  await requireRole("admin");
  const venueId = getRequiredNumber(formData, "venueId", "Venue");
  const tagId = getRequiredNumber(formData, "tagId", "Tag");
  const score = getRequiredNumber(formData, "score", "Score");

  if (score < 1 || score > 5) {
    throw new Error("Tag score must be between 1 and 5.");
  }

  await execute(
    `
      INSERT INTO \`Tagged_With\` (\`VenueID\`, \`TagID\`, \`Score\`)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE \`Score\` = VALUES(\`Score\`)
    `,
    [venueId, tagId, score],
  );

  touchCorePaths();
}

export async function saveBadgeAction(formData: FormData) {
  await requireRole("admin");
  const badgeId = getOptionalNumber(formData, "badgeId");
  const badgeType = getRequiredText(formData, "badgeType", "Badge type");
  const name = getRequiredText(formData, "name", "Badge name");
  const description = getOptionalText(formData, "description");
  const ptsRequired = getRequiredNumber(formData, "ptsRequired", "Points required");

  if (!isValidBadgeType(badgeType)) {
    throw new Error("Invalid badge type.");
  }

  if (ptsRequired < 0) {
    throw new Error("Points required must be zero or greater.");
  }

  if (badgeId) {
    await execute(
      `
        UPDATE \`Badge\`
        SET \`BadgeType\` = ?, \`Name\` = ?, \`Description\` = ?, \`PtsRequired\` = ?
        WHERE \`BadgeID\` = ?
      `,
      [badgeType, name, description, ptsRequired, badgeId],
    );
  } else {
    await execute(
      "INSERT INTO `Badge` (`BadgeType`, `Name`, `Description`, `PtsRequired`) VALUES (?, ?, ?, ?)",
      [badgeType, name, description, ptsRequired],
    );
  }

  touchCorePaths();
}

export async function deleteReviewAdminAction(formData: FormData) {
  await requireRole("admin");
  const reviewId = getRequiredNumber(formData, "reviewId", "Review");
  await execute("DELETE FROM `Review` WHERE `ReviewID` = ?", [reviewId]);
  touchCorePaths();
}

export async function approveSubmissionAction(formData: FormData) {
  const session = await requireRole("admin");
  const submissionId = getRequiredNumber(formData, "submissionId", "Submission");

  await withTransaction(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM `Venue_Submission` WHERE `SubmissionID` = ? LIMIT 1",
      [submissionId],
    );

    if (!rows.length) {
      throw new Error("Submission not found.");
    }

    const submission = rows[0];
    const [venueResult] = await connection.execute<ResultSetHeader>(
      `
        INSERT INTO \`Venue\`
          (\`Name\`, \`Street\`, \`City\`, \`PostalCode\`, \`PriceRange\`, \`Description\`, \`Phone\`, \`Website\`, \`Latitude\`, \`Longitude\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        submission.Name,
        submission.Street,
        submission.City,
        submission.PostalCode,
        submission.PriceRange,
        submission.Description,
        submission.Phone,
        submission.Website,
        submission.Latitude,
        submission.Longitude,
      ],
    );

    await connection.execute(
      `
        UPDATE \`Venue_Submission\`
        SET
          \`Status\` = 'Approved',
          \`ReviewedByAdminID\` = ?,
          \`ApprovedVenueID\` = ?,
          \`ReviewedAt\` = CURRENT_TIMESTAMP
        WHERE \`SubmissionID\` = ?
      `,
      [session.userId, venueResult.insertId, submissionId],
    );
  });

  touchCorePaths();
}

export async function rejectSubmissionAction(formData: FormData) {
  const session = await requireRole("admin");
  const submissionId = getRequiredNumber(formData, "submissionId", "Submission");
  const adminNote = getOptionalText(formData, "adminNote");

  await execute(
    `
      UPDATE \`Venue_Submission\`
      SET
        \`Status\` = 'Rejected',
        \`AdminNote\` = ?,
        \`ReviewedByAdminID\` = ?,
        \`ReviewedAt\` = CURRENT_TIMESTAMP
      WHERE \`SubmissionID\` = ?
    `,
    [adminNote, session.userId, submissionId],
  );

  touchCorePaths();
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireRole("admin");
  const userId = getRequiredNumber(formData, "userId", "User");

  if (userId === session.userId) {
    throw new Error("You cannot delete your own admin account.");
  }

  await execute("DELETE FROM `User` WHERE `UserID` = ?", [userId]);
  touchCorePaths();
}
