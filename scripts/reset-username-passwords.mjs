import mysql from "mysql2/promise";
import process from "node:process";
import { buildConnectionOptions, dbConfig } from "./lib/db-config.mjs";
import { defaultPasswordForUsername, hashPassword } from "./lib/passwords.mjs";

async function main() {
  const connection = await mysql.createConnection(buildConnectionOptions());
  const [rows] = await connection.query("SELECT `UserID`, `Username` FROM `User` ORDER BY `UserID`");

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`No users found in "${dbConfig.database}".`);
    await connection.end();
    return;
  }

  for (const row of rows) {
    const nextPassword = defaultPasswordForUsername(row.Username);
    await connection.query("UPDATE `User` SET `Password` = ? WHERE `UserID` = ?", [
      hashPassword(nextPassword),
      row.UserID,
    ]);
  }

  console.log(`Reset ${rows.length} password(s) in "${dbConfig.database}" to the pattern username123.`);
  console.log("Examples:");
  for (const row of rows.slice(0, 10)) {
    console.log(`  ${row.Username} -> ${defaultPasswordForUsername(row.Username)}`);
  }

  await connection.end();
}

main().catch((error) => {
  console.error("Failed to reset username-based passwords.");
  console.error(error);
  process.exitCode = 1;
});
