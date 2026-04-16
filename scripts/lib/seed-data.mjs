import { defaultPasswordForUsername, hashPassword } from "./passwords.mjs";

export const ATTRIBUTE_NAMES = [
  "Food",
  "Service",
  "Atmosphere",
  "WiFi",
  "Study",
  "Accessibility",
  "Value",
  "Cleanliness",
];

export async function seedDatabase(connection) {
  const users = [
    { id: 1, username: "Praveen", email: "praveen@ucalgary.ca", regDate: "2025-03-15" },
    { id: 2, username: "saira", email: "saira@ucalgary.ca", regDate: "2025-03-16" },
    { id: 3, username: "leo", email: "leo@ucalgary.ca", regDate: "2025-01-17" },
    { id: 4, username: "personA", email: "personA@gmail.com", regDate: "2026-03-15" },
    { id: 5, username: "personB", email: "personB@gmail.com", regDate: "2026-02-02" },
    { id: 6, username: "mia", email: "mia@ucalgary.ca", regDate: "2026-03-22" },
  ];

  for (const user of users) {
    await connection.query(
      "INSERT INTO `User` (`UserID`, `Username`, `Email`, `Password`, `RegDate`) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.username, user.email, hashPassword(defaultPasswordForUsername(user.username)), user.regDate],
    );
  }

  await connection.query("INSERT INTO `Admin` (`UserID`, `AdminLevel`) VALUES (1, 'Super')");
  await connection.query(
    "INSERT INTO `Curator` (`UserID`, `AdminID`, `VerifDate`, `Bio`) VALUES ?",
    [[
      [2, 1, "2026-02-05", "Coffee expert and food critic focused on bean quality, brew precision, and standout espresso."],
      [3, 1, "2026-02-10", "Interior design specialist who reviews cafes for comfort, atmosphere, and study flow."],
    ]],
  );
  await connection.query(
    "INSERT INTO `Regular_User` (`UserID`, `Level`) VALUES ?",
    [[
      [4, 3],
      [5, 2],
      [6, 4],
    ]],
  );

  const venues = [
    [1, "NEW Coffee", "740 17 Ave SW", "Calgary", "T3R 0B7", "$$", "Minimalist cafe with great coffee, calm lighting, and reliable WiFi.", "403-555-0001", "https://www.sample1.ca", 51.0379, -114.0799],
    [2, "Coffee Place", "803 1 St SW", "Calgary", "T2P 1M7", "$$$", "Downtown cafe with fast WiFi, polished service, and premium drinks.", "403-555-0002", "https://www.rc.com", 51.0458, -114.0654],
    [3, "Some Cafe", "940 2 Ave NW", "Calgary", "T2N 0J9", "$", "Budget-friendly student spot with late hours and lots of outlets.", "403-555-0003", "https://www.vsomedomecafe.ca", 51.0535, -114.0867],
    [4, "Night Owl Roasters", "1204 9 Ave SE", "Calgary", "T2G 0S7", "$$", "Late-night cafe built for long work sessions and quiet group study.", "403-555-0004", "https://nightowl.example.com", 51.0428, -114.0391],
    [5, "Parkside Study Hall", "2210 4 St SW", "Calgary", "T2S 1W9", "$$", "Airy neighborhood cafe with soft seating, bright windows, and dependable food.", "403-555-0005", "https://parkside.example.com", 51.0337, -114.0714],
    [6, "Ember & Bean", "638 6 Ave SW", "Calgary", "T2P 0S4", "$$$", "Stylish central cafe with curated pastries and refined espresso service.", "403-555-0006", "https://emberbean.example.com", 51.0477, -114.0757],
  ];

  await connection.query(
    "INSERT INTO `Venue` (`VenueID`, `Name`, `Street`, `City`, `PostalCode`, `PriceRange`, `Description`, `Phone`, `Website`, `Latitude`, `Longitude`) VALUES ?",
    [venues],
  );

  await connection.query(
    "INSERT INTO `Expertise_Category` (`CategoryID`, `AdminID`, `CategoryName`, `Description`) VALUES ?",
    [[
      [1, 1, "Coffee Quality", "Coffee bean sourcing, extraction quality, and espresso consistency."],
      [2, 1, "Interior Design", "Ambiance, comfort, visual identity, and seating flow."],
      [3, 1, "Remote Work", "WiFi, seating ergonomics, outlets, and productivity fit."],
      [4, 1, "Accessibility", "Ease of access, circulation, and inclusive design."],
    ]],
  );

  await connection.query(
    "INSERT INTO `Category_Attribute` (`CategoryID`, `AttributeName`, `Weight`) VALUES ?",
    [[
      [1, "Food", 5],
      [1, "Value", 3],
      [2, "Atmosphere", 5],
      [2, "Cleanliness", 4],
      [3, "WiFi", 5],
      [3, "Study", 5],
      [4, "Accessibility", 5],
      [4, "Service", 3],
    ]],
  );

  await connection.query(
    "INSERT INTO `Specializes_In` (`CuratorID`, `CategoryID`) VALUES ?",
    [[
      [2, 1],
      [2, 3],
      [3, 2],
      [3, 4],
    ]],
  );

  const tags = [
    [1, "WiFi Available", "Amenity"],
    [2, "Study Friendly", "Atmosphere"],
    [3, "Pet Friendly", "Service"],
    [4, "Power Outlets", "Amenity"],
    [5, "Quiet Corners", "Atmosphere"],
    [6, "Wheelchair Access", "Accessibility"],
    [7, "Vegetarian Options", "Dietary"],
    [8, "Signature Pastries", "Service"],
  ];
  await connection.query("INSERT INTO `Tag` (`TagID`, `TagName`, `TagType`) VALUES ?", [tags]);

  await connection.query(
    "INSERT INTO `Tagged_With` (`VenueID`, `TagID`, `Score`) VALUES ?",
    [[
      [1, 1, 4],
      [1, 2, 5],
      [1, 4, 4],
      [1, 5, 4],
      [2, 1, 5],
      [2, 8, 4],
      [2, 6, 4],
      [3, 1, 5],
      [3, 2, 4],
      [3, 4, 5],
      [4, 1, 5],
      [4, 2, 5],
      [4, 4, 5],
      [4, 5, 5],
      [5, 2, 5],
      [5, 6, 5],
      [5, 7, 4],
      [6, 1, 4],
      [6, 8, 5],
      [6, 3, 3],
    ]],
  );

  await connection.query(
    "INSERT INTO `Review` (`ReviewID`, `UserID`, `VenueID`, `DatePosted`, `Comment`) VALUES ?",
    [[
      [1, 2, 1, "2026-03-10 14:30:00", "Excellent coffee quality with a clean espresso finish and a quiet work-friendly room."],
      [2, 4, 2, "2026-03-12 09:00:00", "Great WiFi for studying and the staff kept the space moving without feeling rushed."],
      [3, 5, 3, "2026-03-14 11:00:00", "Good budget option for students, especially if you need lots of outlets."],
      [4, 3, 5, "2026-03-16 13:15:00", "The seating layout and light balance make this one of the easiest places to stay productive for hours."],
      [5, 6, 4, "2026-03-18 19:40:00", "Perfect late-night study cafe. Quiet enough for deep work and still has solid snacks."],
      [6, 4, 1, "2026-03-19 08:50:00", "Reliable place for morning work sessions, especially if atmosphere matters as much as the coffee."],
    ]],
  );

  await connection.query(
    "INSERT INTO `Attribute` (`ReviewID`, `AttributeName`, `RatingValue`) VALUES ?",
    [[
      [1, "Food", 4],
      [1, "Service", 5],
      [1, "Atmosphere", 4],
      [1, "WiFi", 4],
      [2, "WiFi", 5],
      [2, "Study", 5],
      [2, "Service", 4],
      [3, "Value", 5],
      [3, "Study", 4],
      [3, "WiFi", 5],
      [4, "Atmosphere", 5],
      [4, "Cleanliness", 5],
      [4, "Accessibility", 4],
      [5, "Study", 5],
      [5, "WiFi", 5],
      [5, "Value", 4],
      [6, "Atmosphere", 5],
      [6, "Food", 4],
      [6, "Study", 4],
    ]],
  );

  await connection.query(
    "INSERT INTO `Check_In` (`UserID`, `VenueID`, `CheckInTime`, `Notes`) VALUES ?",
    [[
      [4, 1, "2026-03-10 09:00:00", "Starting study session."],
      [5, 2, "2026-03-12 08:30:00", "Working on assignment."],
      [6, 4, "2026-03-18 18:45:00", "Staying for a long evening work block."],
      [4, 5, "2026-03-20 15:10:00", "Came here after class for writing."],
    ]],
  );

  await connection.query(
    "INSERT INTO `Recommends` (`CuratorID`, `VenueID`, `RecNote`, `RecScore`, `CreatedAt`) VALUES ?",
    [[
      [2, 1, "Best coffee profile in the current sample set and consistently strong work-day energy.", 9, "2026-03-08 12:00:00"],
      [2, 4, "A top-tier pick for remote work and late-night sessions.", 10, "2026-03-17 18:00:00"],
      [3, 1, "Beautiful minimalist design with a clean visual identity.", 8, "2026-03-09 10:20:00"],
      [3, 5, "One of the best seating layouts in the city for calm focused work.", 9, "2026-03-15 11:45:00"],
      [3, 6, "Excellent for aesthetics-driven discovery and polished service moments.", 8, "2026-03-18 16:15:00"],
    ]],
  );

  const badges = [
    [1, "Review", "First Review", "Write your first review.", 0],
    [2, "Review", "Three Reviews", "Write three helpful reviews.", 3],
    [3, "Check-In", "First Check-In", "Check in to your first venue.", 0],
    [4, "Check-In", "Explorer", "Check in to five venues.", 5],
    [5, "Social", "First Follow", "Follow your first curator.", 0],
    [6, "Curator", "Trusted Curator", "Build early curator momentum through recommendations and followers.", 3],
  ];
  await connection.query(
    "INSERT INTO `Badge` (`BadgeID`, `BadgeType`, `Name`, `Description`, `PtsRequired`) VALUES ?",
    [badges],
  );

  await connection.query(
    "INSERT INTO `Earns` (`UserID`, `BadgeID`, `DateEarned`) VALUES ?",
    [[
      [4, 1, "2026-03-12"],
      [4, 3, "2026-03-10"],
      [5, 5, "2026-03-14"],
      [2, 6, "2026-03-18"],
    ]],
  );

  await connection.query(
    "INSERT INTO `Follows` (`FollowerID`, `CuratorID`, `FollowedAt`) VALUES ?",
    [[
      [4, 2, "2026-03-11 10:00:00"],
      [5, 2, "2026-03-13 12:00:00"],
      [5, 3, "2026-03-14 18:30:00"],
      [6, 2, "2026-03-18 09:15:00"],
      [6, 3, "2026-03-19 09:30:00"],
    ]],
  );

  for (const userId of [4, 5, 6]) {
    for (const attribute of ATTRIBUTE_NAMES) {
      const weightMap = {
        4: { Food: 3, Service: 3, Atmosphere: 5, WiFi: 5, Study: 5, Accessibility: 2, Value: 4, Cleanliness: 4 },
        5: { Food: 4, Service: 3, Atmosphere: 3, WiFi: 4, Study: 4, Accessibility: 3, Value: 5, Cleanliness: 3 },
        6: { Food: 3, Service: 4, Atmosphere: 4, WiFi: 5, Study: 5, Accessibility: 4, Value: 3, Cleanliness: 5 },
      };
      await connection.query(
        "INSERT INTO `User_Attribute_Preference` (`UserID`, `AttributeName`, `Weight`) VALUES (?, ?, ?)",
        [userId, attribute, weightMap[userId][attribute]],
      );
    }
  }

  await connection.query(
    "INSERT INTO `Venue_Submission` (`CuratorID`, `Name`, `Street`, `City`, `PostalCode`, `PriceRange`, `Description`, `Phone`, `Website`, `Latitude`, `Longitude`, `Status`, `SubmittedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)",
    [
      2,
      "Laneway Chapter",
      "1018 12 Ave SW",
      "Calgary",
      "T2R 0J6",
      "$$",
      "Curator-submitted cafe with strong WiFi and a small, design-forward interior.",
      "403-555-0007",
      "https://lanewaychapter.example.com",
      51.0415,
      -114.0803,
      "2026-03-21 14:10:00",
    ],
  );
}
