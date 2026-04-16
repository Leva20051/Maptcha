import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import path from "node:path";
import process from "node:process";
import { assertSafeDatabaseName, buildConnectionOptions, dbConfig } from "./lib/db-config.mjs";
import { seedDatabase } from "./lib/seed-data.mjs";

const shouldSeedDemoData = (process.env.SEED_DEMO_DATA ?? "").trim().toLowerCase() === "true";

async function main() {
  assertSafeDatabaseName(dbConfig.database);

  const connection = await mysql.createConnection(
    buildConnectionOptions({
      includeDatabase: false,
      extra: { multipleStatements: true },
    }),
  );

  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
  await connection.query(`USE \`${dbConfig.database}\``);

  const [tableRows] = await connection.query("SHOW TABLES LIKE 'User'");
  if (!Array.isArray(tableRows) || tableRows.length === 0) {
    await connection.query(schemaSql);
    console.log(`Applied schema to "${dbConfig.database}".`);
  } else {
    console.log(`Schema already exists in "${dbConfig.database}", skipping table creation.`);
  }

  const [userRows] = await connection.query("SELECT COUNT(*) AS count FROM `User`");
  const existingUsers = Array.isArray(userRows) && userRows[0] ? Number(userRows[0].count ?? 0) : 0;

  if (existingUsers === 0 && shouldSeedDemoData) {
    await seedDatabase(connection);
    console.log("Inserted demo seed data because SEED_DEMO_DATA=true.");
  } else if (existingUsers === 0) {
    console.log("No users found. Demo seed data was skipped.");
    console.log("Create your private admin account with npm run db:create-admin.");
  } else {
    console.log(`Seed data skipped because ${existingUsers} user record(s) already exist.`);
  }

  console.log(`Shared database "${dbConfig.database}" is ready on ${dbConfig.host}:${dbConfig.port}`);
  console.log("This script is non-destructive and safe for a shared cloud database.");

  await connection.end();
}

main().catch((error) => {
  console.error("Failed to prepare the shared Cafe Curator database.");
  console.error(error);
  process.exitCode = 1;
});
