import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";
import process from "node:process";
import { buildConnectionOptions, dbConfig } from "./lib/db-config.mjs";

const requiredEnv = (key) => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }

  return value;
};

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

async function main() {
  const username = requiredEnv("ADMIN_USERNAME");
  const email = requiredEnv("ADMIN_EMAIL");
  const password = requiredEnv("ADMIN_PASSWORD");
  const adminLevel = process.env.ADMIN_LEVEL?.trim() || "Super";

  if (!["Standard", "Senior", "Super"].includes(adminLevel)) {
    throw new Error("ADMIN_LEVEL must be Standard, Senior, or Super.");
  }

  const connection = await mysql.createConnection(buildConnectionOptions());

  const [existingRows] = await connection.query(
    "SELECT `UserID` FROM `User` WHERE `Username` = ? OR `Email` = ? LIMIT 1",
    [username, email],
  );

  if (Array.isArray(existingRows) && existingRows.length > 0) {
    throw new Error("A user with that username or email already exists.");
  }

  const [userResult] = await connection.query(
    `
      INSERT INTO \`User\` (\`Username\`, \`Email\`, \`Password\`, \`RegDate\`)
      VALUES (?, ?, ?, CURRENT_DATE())
    `,
    [username, email, hashPassword(password)],
  );

  await connection.query(
    "INSERT INTO `Admin` (`UserID`, `AdminLevel`) VALUES (?, ?)",
    [userResult.insertId, adminLevel],
  );

  console.log(`Created admin user "${username}" in "${dbConfig.database}".`);

  await connection.end();
}

main().catch((error) => {
  console.error("Failed to create admin user.");
  console.error(error);
  process.exitCode = 1;
});
