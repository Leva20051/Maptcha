import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import path from "node:path";
import process from "node:process";
import { assertSafeDatabaseName, buildConnectionOptions, dbConfig } from "./lib/db-config.mjs";
import { seedDatabase } from "./lib/seed-data.mjs";

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

  await connection.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
  await connection.query(`CREATE DATABASE \`${dbConfig.database}\``);
  await connection.query(`USE \`${dbConfig.database}\``);
  await connection.query(schemaSql);
  await seedDatabase(connection);

  console.log(`Bootstrapped database "${dbConfig.database}" on ${dbConfig.host}:${dbConfig.port}`);
  console.log('Demo credentials use the pattern "username123":');
  console.log("  Admin   -> Praveen / Praveen123");
  console.log("  Curator -> saira / saira123");
  console.log("  Curator -> leo / leo123");
  console.log("  User    -> personA / personA123");
  console.log("  User    -> personB / personB123");
  console.log("  User    -> mia / mia123");

  await connection.end();
}

main().catch((error) => {
  console.error("Failed to bootstrap Cafe Curator DB.");
  console.error(error);
  process.exitCode = 1;
});
