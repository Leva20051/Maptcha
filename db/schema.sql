CREATE TABLE `User` (
  `UserID` INT PRIMARY KEY AUTO_INCREMENT,
  `Username` VARCHAR(50) NOT NULL UNIQUE,
  `Email` VARCHAR(100) NOT NULL UNIQUE,
  `Password` VARCHAR(255) NOT NULL,
  `RegDate` DATE NOT NULL,
  CONSTRAINT `chk_email_format` CHECK (`Email` LIKE '%_@_%._%')
);

CREATE TABLE `Regular_User` (
  `UserID` INT PRIMARY KEY,
  `Level` INT NOT NULL DEFAULT 1,
  FOREIGN KEY (`UserID`) REFERENCES `User` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_level_positive` CHECK (`Level` > 0)
);

CREATE TABLE `Admin` (
  `UserID` INT PRIMARY KEY,
  `AdminLevel` VARCHAR(20) NOT NULL DEFAULT 'Standard',
  FOREIGN KEY (`UserID`) REFERENCES `User` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_admin_level` CHECK (`AdminLevel` IN ('Standard', 'Senior', 'Super'))
);

CREATE TABLE `Curator` (
  `UserID` INT PRIMARY KEY,
  `AdminID` INT NOT NULL,
  `VerifDate` DATE NULL,
  `Bio` TEXT NULL,
  FOREIGN KEY (`UserID`) REFERENCES `User` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`AdminID`) REFERENCES `Admin` (`UserID`)
);

CREATE TABLE `Venue` (
  `VenueID` INT PRIMARY KEY AUTO_INCREMENT,
  `Name` VARCHAR(100) NOT NULL,
  `Street` VARCHAR(200) NOT NULL,
  `City` VARCHAR(50) NOT NULL,
  `PostalCode` VARCHAR(20) NOT NULL,
  `PriceRange` VARCHAR(10) NULL,
  `Description` TEXT NULL,
  `Phone` VARCHAR(20) NULL,
  `Website` VARCHAR(200) NULL,
  `Latitude` DECIMAL(10, 7) NULL,
  `Longitude` DECIMAL(10, 7) NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `chk_price_range` CHECK (`PriceRange` IN ('$', '$$', '$$$', '$$$$') OR `PriceRange` IS NULL)
);

CREATE TABLE `Review` (
  `ReviewID` INT PRIMARY KEY AUTO_INCREMENT,
  `UserID` INT NOT NULL,
  `VenueID` INT NOT NULL,
  `DatePosted` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Comment` TEXT NULL,
  FOREIGN KEY (`UserID`) REFERENCES `User` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`VenueID`) REFERENCES `Venue` (`VenueID`) ON DELETE CASCADE,
  CONSTRAINT `unique_user_venue_review` UNIQUE (`UserID`, `VenueID`, `DatePosted`)
);

CREATE TABLE `Attribute` (
  `ReviewID` INT NOT NULL,
  `AttributeName` VARCHAR(50) NOT NULL,
  `RatingValue` INT NOT NULL,
  PRIMARY KEY (`ReviewID`, `AttributeName`),
  FOREIGN KEY (`ReviewID`) REFERENCES `Review` (`ReviewID`) ON DELETE CASCADE,
  CONSTRAINT `chk_rating_range` CHECK (`RatingValue` BETWEEN 1 AND 5),
  CONSTRAINT `chk_attribute_name` CHECK (`AttributeName` IN (
    'Food',
    'Service',
    'Atmosphere',
    'WiFi',
    'Study',
    'Accessibility',
    'Value',
    'Cleanliness'
  ))
);

CREATE TABLE `Check_In` (
  `UserID` INT NOT NULL,
  `VenueID` INT NOT NULL,
  `CheckInTime` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Notes` TEXT NULL,
  PRIMARY KEY (`UserID`, `VenueID`, `CheckInTime`),
  FOREIGN KEY (`UserID`) REFERENCES `Regular_User` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`VenueID`) REFERENCES `Venue` (`VenueID`) ON DELETE CASCADE
);

CREATE TABLE `Expertise_Category` (
  `CategoryID` INT PRIMARY KEY AUTO_INCREMENT,
  `AdminID` INT NOT NULL,
  `CategoryName` VARCHAR(100) NOT NULL UNIQUE,
  `Description` TEXT NULL,
  FOREIGN KEY (`AdminID`) REFERENCES `Admin` (`UserID`)
);

CREATE TABLE `Category_Attribute` (
  `CategoryID` INT NOT NULL,
  `AttributeName` VARCHAR(50) NOT NULL,
  `Weight` INT NOT NULL DEFAULT 3,
  PRIMARY KEY (`CategoryID`, `AttributeName`),
  FOREIGN KEY (`CategoryID`) REFERENCES `Expertise_Category` (`CategoryID`) ON DELETE CASCADE,
  CONSTRAINT `chk_category_attribute_name` CHECK (`AttributeName` IN (
    'Food',
    'Service',
    'Atmosphere',
    'WiFi',
    'Study',
    'Accessibility',
    'Value',
    'Cleanliness'
  )),
  CONSTRAINT `chk_category_attribute_weight` CHECK (`Weight` BETWEEN 1 AND 5)
);

CREATE TABLE `Specializes_In` (
  `CuratorID` INT NOT NULL,
  `CategoryID` INT NOT NULL,
  PRIMARY KEY (`CuratorID`, `CategoryID`),
  FOREIGN KEY (`CuratorID`) REFERENCES `Curator` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`CategoryID`) REFERENCES `Expertise_Category` (`CategoryID`) ON DELETE CASCADE
);

CREATE TABLE `Recommends` (
  `CuratorID` INT NOT NULL,
  `VenueID` INT NOT NULL,
  `RecNote` TEXT NULL,
  `RecScore` INT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CuratorID`, `VenueID`),
  FOREIGN KEY (`CuratorID`) REFERENCES `Curator` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`VenueID`) REFERENCES `Venue` (`VenueID`) ON DELETE CASCADE,
  CONSTRAINT `chk_rec_score` CHECK (`RecScore` BETWEEN 1 AND 10 OR `RecScore` IS NULL)
);

CREATE TABLE `Badge` (
  `BadgeID` INT PRIMARY KEY AUTO_INCREMENT,
  `BadgeType` VARCHAR(50) NOT NULL,
  `Name` VARCHAR(100) NOT NULL UNIQUE,
  `Description` TEXT NULL,
  `PtsRequired` INT NOT NULL,
  CONSTRAINT `chk_pts_required` CHECK (`PtsRequired` >= 0),
  CONSTRAINT `chk_badge_type` CHECK (`BadgeType` IN ('Review', 'Check-In', 'Social', 'Curator'))
);

CREATE TABLE `Earns` (
  `UserID` INT NOT NULL,
  `BadgeID` INT NOT NULL,
  `DateEarned` DATE NOT NULL,
  PRIMARY KEY (`UserID`, `BadgeID`),
  FOREIGN KEY (`UserID`) REFERENCES `User` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`BadgeID`) REFERENCES `Badge` (`BadgeID`) ON DELETE CASCADE
);

CREATE TABLE `Follows` (
  `FollowerID` INT NOT NULL,
  `CuratorID` INT NOT NULL,
  `FollowedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`FollowerID`, `CuratorID`),
  FOREIGN KEY (`FollowerID`) REFERENCES `Regular_User` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`CuratorID`) REFERENCES `Curator` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_no_self_follow` CHECK (`FollowerID` <> `CuratorID`)
);

CREATE TABLE `Tag` (
  `TagID` INT PRIMARY KEY AUTO_INCREMENT,
  `TagName` VARCHAR(50) NOT NULL UNIQUE,
  `TagType` VARCHAR(30) NOT NULL,
  CONSTRAINT `chk_tag_type` CHECK (`TagType` IN ('Amenity', 'Atmosphere', 'Service', 'Dietary', 'Accessibility'))
);

CREATE TABLE `Tagged_With` (
  `VenueID` INT NOT NULL,
  `TagID` INT NOT NULL,
  `Score` INT NULL,
  PRIMARY KEY (`VenueID`, `TagID`),
  FOREIGN KEY (`VenueID`) REFERENCES `Venue` (`VenueID`) ON DELETE CASCADE,
  FOREIGN KEY (`TagID`) REFERENCES `Tag` (`TagID`) ON DELETE CASCADE,
  CONSTRAINT `chk_tag_score` CHECK (`Score` BETWEEN 1 AND 5 OR `Score` IS NULL)
);

CREATE TABLE `User_Attribute_Preference` (
  `UserID` INT NOT NULL,
  `AttributeName` VARCHAR(50) NOT NULL,
  `Weight` INT NOT NULL DEFAULT 3,
  PRIMARY KEY (`UserID`, `AttributeName`),
  FOREIGN KEY (`UserID`) REFERENCES `Regular_User` (`UserID`) ON DELETE CASCADE,
  CONSTRAINT `chk_pref_attribute_name` CHECK (`AttributeName` IN (
    'Food',
    'Service',
    'Atmosphere',
    'WiFi',
    'Study',
    'Accessibility',
    'Value',
    'Cleanliness'
  )),
  CONSTRAINT `chk_pref_weight` CHECK (`Weight` BETWEEN 1 AND 5)
);

CREATE TABLE `Venue_Submission` (
  `SubmissionID` INT PRIMARY KEY AUTO_INCREMENT,
  `CuratorID` INT NOT NULL,
  `Name` VARCHAR(100) NOT NULL,
  `Street` VARCHAR(200) NOT NULL,
  `City` VARCHAR(50) NOT NULL,
  `PostalCode` VARCHAR(20) NOT NULL,
  `PriceRange` VARCHAR(10) NULL,
  `Description` TEXT NULL,
  `Phone` VARCHAR(20) NULL,
  `Website` VARCHAR(200) NULL,
  `Latitude` DECIMAL(10, 7) NULL,
  `Longitude` DECIMAL(10, 7) NULL,
  `Status` VARCHAR(20) NOT NULL DEFAULT 'Pending',
  `AdminNote` TEXT NULL,
  `ReviewedByAdminID` INT NULL,
  `ApprovedVenueID` INT NULL,
  `SubmittedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ReviewedAt` DATETIME NULL,
  FOREIGN KEY (`CuratorID`) REFERENCES `Curator` (`UserID`) ON DELETE CASCADE,
  FOREIGN KEY (`ReviewedByAdminID`) REFERENCES `Admin` (`UserID`) ON DELETE SET NULL,
  FOREIGN KEY (`ApprovedVenueID`) REFERENCES `Venue` (`VenueID`) ON DELETE SET NULL,
  CONSTRAINT `chk_submission_status` CHECK (`Status` IN ('Pending', 'Approved', 'Rejected')),
  CONSTRAINT `chk_submission_price_range` CHECK (`PriceRange` IN ('$', '$$', '$$$', '$$$$') OR `PriceRange` IS NULL)
);

CREATE INDEX `idx_venue_city` ON `Venue` (`City`);
CREATE INDEX `idx_venue_name` ON `Venue` (`Name`);
CREATE INDEX `idx_review_venue` ON `Review` (`VenueID`);
CREATE INDEX `idx_review_user` ON `Review` (`UserID`);
CREATE INDEX `idx_recommendation_venue` ON `Recommends` (`VenueID`);
CREATE INDEX `idx_recommendation_curator` ON `Recommends` (`CuratorID`);
CREATE INDEX `idx_checkin_venue` ON `Check_In` (`VenueID`);
CREATE INDEX `idx_follow_curator` ON `Follows` (`CuratorID`);
CREATE INDEX `idx_submission_status` ON `Venue_Submission` (`Status`);
