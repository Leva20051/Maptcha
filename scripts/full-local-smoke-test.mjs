import mysql from "mysql2/promise";
import process from "node:process";
import { buildConnectionOptions } from "./lib/db-config.mjs";
import { defaultPasswordForUsername } from "./lib/passwords.mjs";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message) {
  console.log(`[smoke] ${message}`);
}

function extractForms(html) {
  return [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((match) => match[0]);
}

function extractActionName(formHtml) {
  return formHtml.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1] ?? null;
}

function extractHiddenInputs(formHtml) {
  const hidden = new Map();

  for (const match of formHtml.matchAll(/<input[^>]*type="hidden"[^>]*name="([^"]+)"[^>]*value="([^"]*)"/g)) {
    hidden.set(match[1], match[2]);
  }

  return hidden;
}

function findForm(html, { names = [], absentNames = [], textIncludes = [] }) {
  for (const formHtml of extractForms(html)) {
    const actionName = extractActionName(formHtml);

    if (!actionName) {
      continue;
    }

    if (!names.every((name) => formHtml.includes(`name="${name}"`))) {
      continue;
    }

    if (absentNames.some((name) => formHtml.includes(`name="${name}"`))) {
      continue;
    }

    if (!textIncludes.every((text) => formHtml.includes(text))) {
      continue;
    }

    return {
      formHtml,
      actionName,
      hiddenInputs: extractHiddenInputs(formHtml),
    };
  }

  throw new Error(`Could not find form for names=${names.join(",")} text=${textIncludes.join(",")}`);
}

class SessionClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.cookies = new Map();
  }

  _cookieHeader() {
    return [...this.cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }

  _storeCookies(response) {
    const setCookies = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie")]
        : [];

    for (const header of setCookies) {
      const [cookiePart] = header.split(";", 1);
      const [name, ...valueParts] = cookiePart.split("=");

      if (!name) {
        continue;
      }

      const value = valueParts.join("=");

      if (!value) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  async request(path, options = {}) {
    const headers = new Headers(options.headers ?? {});
    const cookieHeader = this._cookieHeader();

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    const response = await fetch(new URL(path, this.baseUrl), {
      redirect: "manual",
      ...options,
      headers,
    });

    this._storeCookies(response);
    return response;
  }

  async getText(path) {
    const response = await this.request(path);
    expect(response.status >= 200 && response.status < 400, `GET ${path} failed with ${response.status}`);
    return response.text();
  }

  async submit(path, formInfo, fields = {}) {
    const formData = new FormData();
    formData.set(formInfo.actionName, "");

    for (const [name, value] of formInfo.hiddenInputs.entries()) {
      if (name !== formInfo.actionName && !(name in fields)) {
        formData.set(name, value);
      }
    }

    for (const [name, value] of Object.entries(fields)) {
      formData.set(name, String(value));
    }

    const response = await this.request(path, {
      method: "POST",
      body: formData,
    });

    expect([200, 303].includes(response.status), `POST ${path} failed with ${response.status}`);
    return response;
  }

  async logout() {
    const response = await this.request("/logout");
    expect([302, 307, 308].includes(response.status), `Logout failed with ${response.status}`);
  }
}

async function openDb() {
  return mysql.createConnection(buildConnectionOptions());
}

async function queryOne(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

async function queryCount(connection, sql, params = []) {
  const row = await queryOne(connection, sql, params);
  const firstValue = row ? Object.values(row)[0] : 0;
  return Number(firstValue ?? 0);
}

async function assertPage(path) {
  const response = await fetch(new URL(path, BASE_URL), { redirect: "manual" });
  expect(response.status === 200, `Expected ${path} to return 200, got ${response.status}`);
}

async function assertPageContains(path, expectedText) {
  const response = await fetch(new URL(path, BASE_URL), { redirect: "manual" });
  expect(response.status === 200, `Expected ${path} to return 200, got ${response.status}`);
  const html = await response.text();
  expect(html.includes(expectedText), `Expected ${path} to include "${expectedText}"`);
}

async function loginAt(path, identifier, password, expectedLocation) {
  const client = new SessionClient(BASE_URL);
  const html = await client.getText(path);
  const form = findForm(html, { names: ["identifier", "password"] });
  const response = await client.submit(path, form, { identifier, password });

  expect(response.status === 303, `Expected login for ${identifier} to redirect, got ${response.status}`);
  expect(response.headers.get("location") === expectedLocation, `Unexpected login destination for ${identifier}`);

  return client;
}

async function main() {
  const db = await openDb();
  const stamp = Date.now();
  const regularUsername = `smokereg${stamp}`;
  const regularPassword = defaultPasswordForUsername(regularUsername);
  const curatorUsername = `smokecur${stamp}`;
  const curatorPassword = defaultPasswordForUsername(curatorUsername);
  const smokeCategoryName = `Smoke Category ${stamp}`;
  const smokeTagName = `Smoke Tag ${stamp}`;
  const smokeBadgeName = `Smoke Badge ${stamp}`;
  const smokeVenueName = `Smoke Venue ${stamp}`;
  const approveName = `Smoke Approve ${stamp}`;
  const rejectName = `Smoke Reject ${stamp}`;

  logStep("checking public pages");
  for (const path of [
    "/",
    "/venues",
    "/venues/1",
    "/curators",
    "/curators/2",
    "/login/user",
    "/login/curator",
    "/login/admin",
    "/register/user",
    "/register/curator",
  ]) {
    await assertPage(path);
  }

  logStep("checking signed-out protected access screens");
  await assertPageContains("/dashboard", "Regular dashboard access");
  await assertPageContains("/curator-studio", "Curator studio access");
  await assertPageContains("/admin", "Admin console access");
  await assertPageContains("/account", "Sign in to manage your profile without leaving this layout.");

  logStep("checking seeded logins with username123 passwords");
  const seededRegular = await loginAt("/login/user", "personA", "personA123", "/dashboard");
  await seededRegular.logout();
  const seededCurator = await loginAt("/login/curator", "saira", "saira123", "/curator-studio");
  await seededCurator.logout();
  const admin = await loginAt("/login/admin", "Praveen", "Praveen123", "/admin");

  logStep("checking role redirects");
  const adminDashboardResponse = await admin.request("/dashboard");
  expect(adminDashboardResponse.status === 307, `Admin dashboard redirect should be 307, got ${adminDashboardResponse.status}`);
  expect(adminDashboardResponse.headers.get("location") === "/admin", "Admin should redirect to /admin from /dashboard");

  logStep("registering a regular user");
  const regular = new SessionClient(BASE_URL);
  {
    const html = await regular.getText("/register/user");
    const form = findForm(html, { names: ["username", "email", "password"] });
    const response = await regular.submit("/register/user", form, {
      username: regularUsername,
      email: `${regularUsername}@example.com`,
      password: regularPassword,
    });
    expect(response.status === 303, "Regular registration should redirect");
    expect(response.headers.get("location") === "/dashboard", "Regular registration should land on /dashboard");
  }

  const regularUser = await queryOne(
    db,
    "SELECT UserID, Username, Email FROM `User` WHERE `Username` = ? LIMIT 1",
    [regularUsername],
  );
  expect(regularUser, "Regular user row was not created");
  expect(
    await queryCount(db, "SELECT COUNT(*) FROM `Regular_User` WHERE `UserID` = ?", [regularUser.UserID]) === 1,
    "Regular_User row missing for new regular user",
  );
  expect(
    await queryCount(db, "SELECT COUNT(*) FROM `User_Attribute_Preference` WHERE `UserID` = ?", [regularUser.UserID]) === 8,
    "Default preference rows missing for regular user",
  );

  await regular.logout();

  logStep("logging the regular user back in");
  {
    const loginClient = await loginAt("/login/user", regularUsername, regularPassword, "/dashboard");
    regular.cookies = loginClient.cookies;
  }

  logStep("testing regular account profile and preference updates");
  {
    const accountHtml = await regular.getText("/account");
    const profileForm = findForm(accountHtml, {
      names: ["username", "email"],
      absentNames: ["bio", "pref_Food"],
      textIncludes: ["Save regular profile"],
    });
    await regular.submit("/account", profileForm, {
      username: regularUsername,
      email: `${regularUsername}.updated@example.com`,
    });

    const prefsForm = findForm(accountHtml, {
      names: ["pref_Food", "pref_WiFi", "pref_Study"],
      textIncludes: ["Save weighting profile"],
    });
    await regular.submit("/account", prefsForm, {
      pref_Food: 5,
      pref_Service: 2,
      pref_Atmosphere: 4,
      pref_WiFi: 5,
      pref_Study: 5,
      pref_Accessibility: 3,
      pref_Value: 4,
      pref_Cleanliness: 4,
    });

    const prefFood = await queryOne(
      db,
      "SELECT Weight FROM `User_Attribute_Preference` WHERE `UserID` = ? AND `AttributeName` = 'Food'",
      [regularUser.UserID],
    );
    expect(Number(prefFood.Weight) === 5, "Regular preference update failed");
  }

  logStep("testing regular follow and unfollow flows");
  {
    let curatorsHtml = await regular.getText("/curators");
    let followForm = findForm(curatorsHtml, { names: ["curatorId"], textIncludes: ["Follow curator", 'value="2"'] });
    await regular.submit("/curators", followForm);
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Follows` WHERE `FollowerID` = ? AND `CuratorID` = 2", [regularUser.UserID]) === 1,
      "Follow action did not create a row",
    );

    curatorsHtml = await regular.getText("/curators");
    const unfollowForm = findForm(curatorsHtml, { names: ["curatorId"], textIncludes: ["Unfollow curator", 'value="2"'] });
    await regular.submit("/curators", unfollowForm);
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Follows` WHERE `FollowerID` = ? AND `CuratorID` = 2", [regularUser.UserID]) === 0,
      "Unfollow action did not remove the row",
    );

    curatorsHtml = await regular.getText("/curators");
    followForm = findForm(curatorsHtml, { names: ["curatorId"], textIncludes: ["Follow curator", 'value="2"'] });
    await regular.submit("/curators", followForm);
  }

  logStep("testing regular check-ins and review create/update/delete");
  {
    let venueHtml = await regular.getText("/venues/1");
    const checkinForm = findForm(venueHtml, { names: ["venueId", "notes"], textIncludes: ["Create check-in"] });
    await regular.submit("/venues/1", checkinForm, { notes: "Smoke test regular check-in" });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Check_In` WHERE `UserID` = ? AND `VenueID` = 1", [regularUser.UserID]) >= 1,
      "Check-in row was not created",
    );

    let reviewForm = findForm(venueHtml, {
      names: ["venueId", "comment", "rating_Food", "rating_WiFi"],
      absentNames: ["reviewId"],
      textIncludes: ["Save review"],
    });
    await regular.submit("/venues/1", reviewForm, {
      comment: "Smoke test regular review",
      rating_Food: 4,
      rating_WiFi: 5,
      rating_Study: 4,
    });

    let reviewRow = await queryOne(
      db,
      "SELECT `ReviewID`, `Comment` FROM `Review` WHERE `UserID` = ? AND `VenueID` = 1 ORDER BY `ReviewID` DESC LIMIT 1",
      [regularUser.UserID],
    );
    expect(reviewRow?.Comment === "Smoke test regular review", "Regular review was not created");

    venueHtml = await regular.getText("/venues/1");
    reviewForm = findForm(venueHtml, {
      names: ["venueId", "reviewId", "comment", "rating_Food", "rating_WiFi"],
      textIncludes: ["Save review"],
    });
    await regular.submit("/venues/1", reviewForm, {
      reviewId: reviewRow.ReviewID,
      comment: "Smoke test regular review updated",
      rating_Food: 3,
      rating_Service: 4,
    });

    reviewRow = await queryOne(
      db,
      "SELECT `ReviewID`, `Comment` FROM `Review` WHERE `ReviewID` = ? LIMIT 1",
      [reviewRow.ReviewID],
    );
    expect(reviewRow?.Comment === "Smoke test regular review updated", "Regular review update failed");
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Attribute` WHERE `ReviewID` = ?", [reviewRow.ReviewID]) === 2,
      "Regular review attribute refresh failed",
    );

    venueHtml = await regular.getText("/venues/1");
    const deleteOwnReviewForm = findForm(venueHtml, {
      names: ["reviewId", "venueId"],
      textIncludes: ["Delete"],
    });
    await regular.submit("/venues/1", deleteOwnReviewForm);
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Review` WHERE `ReviewID` = ?", [reviewRow.ReviewID]) === 0,
      "Own review delete failed",
    );

    venueHtml = await regular.getText("/venues/2");
    reviewForm = findForm(venueHtml, {
      names: ["venueId", "comment", "rating_Food", "rating_WiFi"],
      absentNames: ["reviewId"],
      textIncludes: ["Save review"],
    });
    await regular.submit("/venues/2", reviewForm, {
      comment: "Smoke test review for admin moderation",
      rating_Food: 5,
      rating_Value: 4,
    });
  }

  const moderationReview = await queryOne(
    db,
    "SELECT `ReviewID` FROM `Review` WHERE `UserID` = ? AND `VenueID` = 2 ORDER BY `ReviewID` DESC LIMIT 1",
    [regularUser.UserID],
  );
  expect(moderationReview, "Moderation review was not created");

  logStep("registering and testing a curator user");
  const curator = new SessionClient(BASE_URL);
  {
    const html = await curator.getText("/register/curator");
    const form = findForm(html, { names: ["username", "email", "password", "bio"] });
    const response = await curator.submit("/register/curator", form, {
      username: curatorUsername,
      email: `${curatorUsername}@example.com`,
      password: curatorPassword,
      bio: "Smoke test curator bio",
    });
    expect(response.status === 303, "Curator registration should redirect");
    expect(response.headers.get("location") === "/curator-studio", "Curator registration should land on /curator-studio");
  }

  const curatorUser = await queryOne(
    db,
    "SELECT u.UserID, u.Email, c.VerifDate FROM `User` u JOIN `Curator` c ON c.UserID = u.UserID WHERE u.Username = ? LIMIT 1",
    [curatorUsername],
  );
  expect(curatorUser, "Curator user row was not created");
  expect(curatorUser.VerifDate === null, "New curator should start unverified");

  await curator.logout();
  {
    const loginClient = await loginAt("/login/curator", curatorUsername, curatorPassword, "/curator-studio");
    curator.cookies = loginClient.cookies;
  }

  logStep("testing curator profile, categories, recommendations, reviews, and submissions");
  {
    const accountHtml = await curator.getText("/account");
    const curatorProfileForm = findForm(accountHtml, {
      names: ["username", "email", "bio"],
      textIncludes: ["Save curator profile"],
    });
    await curator.submit("/account", curatorProfileForm, {
      username: curatorUsername,
      email: `${curatorUsername}.updated@example.com`,
      bio: "Updated smoke curator bio",
    });

    let studioHtml = await curator.getText("/curator-studio");
    const categoryForm = findForm(studioHtml, {
      names: ["categoryId", "enabled"],
      textIncludes: ["Add specialization"],
    });
    const selectedCategoryId = categoryForm.hiddenInputs.get("categoryId");
    await curator.submit("/curator-studio", categoryForm);
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Specializes_In` WHERE `CuratorID` = ? AND `CategoryID` = ?", [
        curatorUser.UserID,
        Number(selectedCategoryId),
      ]) === 1,
      "Curator category toggle failed",
    );

    const studioRecommendationForm = findForm(studioHtml, {
      names: ["venueId", "recScore", "recNote"],
      textIncludes: ["Save recommendation"],
    });
    await curator.submit("/curator-studio", studioRecommendationForm, {
      venueId: 1,
      recScore: 8,
      recNote: "Smoke test curator recommendation",
    });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Recommends` WHERE `CuratorID` = ? AND `VenueID` = 1", [curatorUser.UserID]) === 1,
      "Curator recommendation save failed",
    );

    let venueHtml = await curator.getText("/venues/1");
    const deleteRecommendationForm = findForm(venueHtml, {
      names: ["venueId"],
      textIncludes: ["Delete my recommendation"],
    });
    await curator.submit("/venues/1", deleteRecommendationForm);
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Recommends` WHERE `CuratorID` = ? AND `VenueID` = 1", [curatorUser.UserID]) === 0,
      "Curator recommendation delete failed",
    );

    venueHtml = await curator.getText("/venues/1");
    const venueRecommendationForm = findForm(venueHtml, {
      names: ["venueId", "recScore", "recNote"],
      textIncludes: ["Save recommendation"],
    });
    await curator.submit("/venues/1", venueRecommendationForm, {
      recScore: 9,
      recNote: "Smoke test curator recommendation via venue page",
    });

    const expertReviewForm = findForm(venueHtml, {
      names: ["venueId", "comment", "rating_Food", "rating_WiFi"],
      absentNames: ["reviewId", "recScore"],
      textIncludes: ["Publish expert review"],
    });
    await curator.submit("/venues/1", expertReviewForm, {
      comment: "Smoke test curator expert review",
      rating_Atmosphere: 5,
      rating_Cleanliness: 4,
    });

    studioHtml = await curator.getText("/curator-studio");
    const submissionForm = findForm(studioHtml, {
      names: ["name", "street", "city", "postalCode", "priceRange"],
      textIncludes: ["Submit venue"],
    });
    await curator.submit("/curator-studio", submissionForm, {
      name: approveName,
      street: "100 Smoke Ave SW",
      city: "Calgary",
      postalCode: "T2X 1A1",
      priceRange: "$$",
      phone: "403-555-1010",
      website: "https://approve-smoke.example.com",
      latitude: "51.0401",
      longitude: "-114.0701",
      description: "Submission that should be approved",
    });
    await curator.submit("/curator-studio", submissionForm, {
      name: rejectName,
      street: "101 Smoke Ave SW",
      city: "Calgary",
      postalCode: "T2X 1A2",
      priceRange: "$",
      phone: "403-555-2020",
      website: "https://reject-smoke.example.com",
      latitude: "51.0402",
      longitude: "-114.0702",
      description: "Submission that should be rejected",
    });
  }

  const curatorReview = await queryOne(
    db,
    "SELECT `ReviewID` FROM `Review` WHERE `UserID` = ? AND `VenueID` = 1 ORDER BY `ReviewID` DESC LIMIT 1",
    [curatorUser.UserID],
  );
  expect(curatorReview, "Curator expert review was not created");

  logStep("testing admin account flow and system-wide actions");
  {
    const adminAccountHtml = await admin.getText("/account");
    const adminProfileForm = findForm(adminAccountHtml, {
      names: ["username", "email"],
      absentNames: ["bio", "pref_Food"],
      textIncludes: ["Save admin profile"],
    });
    await admin.submit("/account", adminProfileForm, {
      username: "Praveen",
      email: "praveen@ucalgary.ca",
    });

    const adminHtml = await admin.getText("/admin");
    const verifyCuratorForm = findForm(adminHtml, {
      names: ["curatorId"],
      textIncludes: ["Verify curator", `value="${curatorUser.UserID}"`],
    });
    await admin.submit("/admin", verifyCuratorForm);
    const verifiedCurator = await queryOne(
      db,
      "SELECT `VerifDate` FROM `Curator` WHERE `UserID` = ?",
      [curatorUser.UserID],
    );
    expect(verifiedCurator?.VerifDate, "Curator verification failed");

    const saveVenueForm = findForm(adminHtml, {
      names: ["name", "street", "city", "postalCode", "priceRange", "latitude", "longitude"],
      textIncludes: ["Save venue"],
    });
    await admin.submit("/admin", saveVenueForm, {
      name: smokeVenueName,
      street: "500 Admin Way SW",
      city: "Calgary",
      postalCode: "T2X 9Z9",
      priceRange: "$$$",
      phone: "403-555-3030",
      website: "https://admin-venue.example.com",
      latitude: "51.0505",
      longitude: "-114.0505",
      description: "Admin-created smoke venue",
    });
    const createdVenue = await queryOne(db, "SELECT `VenueID` FROM `Venue` WHERE `Name` = ? ORDER BY `VenueID` DESC LIMIT 1", [
      smokeVenueName,
    ]);
    expect(createdVenue, "Admin venue creation failed");

    const saveCategoryForm = findForm(adminHtml, {
      names: ["categoryId", "categoryName", "description"],
      absentNames: ["attributeName", "weight"],
      textIncludes: ["Save category"],
    });
    await admin.submit("/admin", saveCategoryForm, {
      categoryName: smokeCategoryName,
      description: "Smoke category description",
    });
    const createdCategory = await queryOne(
      db,
      "SELECT `CategoryID` FROM `Expertise_Category` WHERE `CategoryName` = ? ORDER BY `CategoryID` DESC LIMIT 1",
      [smokeCategoryName],
    );
    expect(createdCategory, "Admin category creation failed");

    const categoryAttributeForm = findForm(adminHtml, {
      names: ["categoryId", "attributeName", "weight"],
      textIncludes: ["Save category mapping"],
    });
    await admin.submit("/admin", categoryAttributeForm, {
      categoryId: createdCategory.CategoryID,
      attributeName: "Food",
      weight: 5,
    });
    expect(
      await queryCount(
        db,
        "SELECT COUNT(*) FROM `Category_Attribute` WHERE `CategoryID` = ? AND `AttributeName` = 'Food' AND `Weight` = 5",
        [createdCategory.CategoryID],
      ) === 1,
      "Admin category attribute mapping failed",
    );

    const assignCategoryForm = findForm(adminHtml, {
      names: ["curatorId", "categoryId", "enabled"],
      textIncludes: ["Apply category assignment"],
    });
    await admin.submit("/admin", assignCategoryForm, {
      curatorId: curatorUser.UserID,
      categoryId: createdCategory.CategoryID,
      enabled: 1,
    });
    expect(
      await queryCount(
        db,
        "SELECT COUNT(*) FROM `Specializes_In` WHERE `CuratorID` = ? AND `CategoryID` = ?",
        [curatorUser.UserID, createdCategory.CategoryID],
      ) === 1,
      "Admin curator-category assignment failed",
    );

    const saveTagForm = findForm(adminHtml, {
      names: ["tagId", "tagName", "tagType"],
      textIncludes: ["Save tag"],
    });
    await admin.submit("/admin", saveTagForm, {
      tagName: smokeTagName,
      tagType: "Amenity",
    });
    const createdTag = await queryOne(db, "SELECT `TagID` FROM `Tag` WHERE `TagName` = ? ORDER BY `TagID` DESC LIMIT 1", [
      smokeTagName,
    ]);
    expect(createdTag, "Admin tag creation failed");

    const assignTagForm = findForm(adminHtml, {
      names: ["venueId", "tagId", "score"],
      textIncludes: ["Assign tag to venue"],
    });
    await admin.submit("/admin", assignTagForm, {
      venueId: createdVenue.VenueID,
      tagId: createdTag.TagID,
      score: 4,
    });
    expect(
      await queryCount(
        db,
        "SELECT COUNT(*) FROM `Tagged_With` WHERE `VenueID` = ? AND `TagID` = ?",
        [createdVenue.VenueID, createdTag.TagID],
      ) === 1,
      "Admin venue-tag assignment failed",
    );

    const saveBadgeForm = findForm(adminHtml, {
      names: ["badgeId", "badgeType", "name", "ptsRequired"],
      textIncludes: ["Save badge"],
    });
    await admin.submit("/admin", saveBadgeForm, {
      badgeType: "Social",
      name: smokeBadgeName,
      ptsRequired: 2,
      description: "Smoke badge description",
    });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Badge` WHERE `Name` = ?", [smokeBadgeName]) === 1,
      "Admin badge creation failed",
    );

    const approveForm = findForm(adminHtml, {
      names: ["submissionId"],
      textIncludes: ["Approve submission"],
    });
    const rejectForm = findForm(adminHtml, {
      names: ["submissionId", "adminNote"],
      textIncludes: ["Reject submission"],
    });
    const approveSubmissionId = await queryOne(
      db,
      "SELECT `SubmissionID` FROM `Venue_Submission` WHERE `CuratorID` = ? AND `Name` = ? ORDER BY `SubmissionID` DESC LIMIT 1",
      [curatorUser.UserID, approveName],
    );
    const rejectSubmissionId = await queryOne(
      db,
      "SELECT `SubmissionID` FROM `Venue_Submission` WHERE `CuratorID` = ? AND `Name` = ? ORDER BY `SubmissionID` DESC LIMIT 1",
      [curatorUser.UserID, rejectName],
    );
    expect(approveSubmissionId && rejectSubmissionId, "Curator submissions were not found for approval flow");

    await admin.submit("/admin", approveForm, { submissionId: approveSubmissionId.SubmissionID });
    await admin.submit("/admin", rejectForm, {
      submissionId: rejectSubmissionId.SubmissionID,
      adminNote: "Smoke test rejection note",
    });

    const approvedSubmission = await queryOne(
      db,
      "SELECT `Status`, `ApprovedVenueID` FROM `Venue_Submission` WHERE `SubmissionID` = ?",
      [approveSubmissionId.SubmissionID],
    );
    expect(approvedSubmission?.Status === "Approved" && approvedSubmission?.ApprovedVenueID, "Submission approval failed");
    const rejectedSubmission = await queryOne(
      db,
      "SELECT `Status`, `AdminNote` FROM `Venue_Submission` WHERE `SubmissionID` = ?",
      [rejectSubmissionId.SubmissionID],
    );
    expect(
      rejectedSubmission?.Status === "Rejected" && rejectedSubmission?.AdminNote === "Smoke test rejection note",
      "Submission rejection failed",
    );

    const deleteReviewForm = findForm(adminHtml, {
      names: ["reviewId"],
      textIncludes: ["Remove review", `value="${curatorReview.ReviewID}"`],
    });
    await admin.submit("/admin", deleteReviewForm, { reviewId: curatorReview.ReviewID });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Review` WHERE `ReviewID` = ?", [curatorReview.ReviewID]) === 0,
      "Admin review moderation delete failed",
    );

    const adminHtmlAfterVenueCreate = await admin.getText("/admin");
    const deleteVenueForm = findForm(adminHtmlAfterVenueCreate, {
      names: ["venueId"],
      textIncludes: ["Delete venue", `value="${createdVenue.VenueID}"`],
    });
    await admin.submit("/admin", deleteVenueForm, { venueId: createdVenue.VenueID });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Venue` WHERE `VenueID` = ?", [createdVenue.VenueID]) === 0,
      "Admin venue delete failed",
    );

    const deleteApprovedVenueForm = findForm(await admin.getText("/admin"), {
      names: ["venueId"],
      textIncludes: ["Delete venue", `value="${approvedSubmission.ApprovedVenueID}"`],
    });
    await admin.submit("/admin", deleteApprovedVenueForm, { venueId: approvedSubmission.ApprovedVenueID });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Venue` WHERE `VenueID` = ?", [approvedSubmission.ApprovedVenueID]) === 0,
      "Admin approved venue cleanup failed",
    );

    const refreshedAdminHtml = await admin.getText("/admin");
    const deleteUserForm = findForm(refreshedAdminHtml, {
      names: ["userId"],
      textIncludes: ["Delete", `value="${regularUser.UserID}"`],
    });
    await admin.submit("/admin", deleteUserForm, { userId: regularUser.UserID });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `User` WHERE `UserID` = ?", [regularUser.UserID]) === 0,
      "Admin user delete failed for regular user",
    );
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `Review` WHERE `ReviewID` = ?", [moderationReview.ReviewID]) === 0,
      "Regular review should be removed by cascade when deleting the user",
    );

    const deleteCuratorForm = findForm(await admin.getText("/admin"), {
      names: ["userId"],
      textIncludes: ["Delete", `value="${curatorUser.UserID}"`],
    });
    await admin.submit("/admin", deleteCuratorForm, { userId: curatorUser.UserID });
    expect(
      await queryCount(db, "SELECT COUNT(*) FROM `User` WHERE `UserID` = ?", [curatorUser.UserID]) === 0,
      "Admin user delete failed for curator user",
    );
  }

  logStep("checking badge and feed side-effects on the seeded regular account");
  expect(
    await queryCount(db, "SELECT COUNT(*) FROM `Earns` WHERE `UserID` = 4") >= 1,
    "Expected at least one badge row for seeded regular user",
  );

  await db.end();
  console.log("\n[smoke] Full local smoke test passed.");
}

main().catch((error) => {
  console.error("\n[smoke] Full local smoke test failed.");
  console.error(error);
  process.exitCode = 1;
});
