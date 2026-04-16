import process from "node:process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const coalesceEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];

    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean environment value "${value}"`);
};

const parseNumber = (value, fallback) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment value "${value}"`);
  }

  return parsed;
};

const parseDatabaseUrl = (value) => {
  const url = new URL(value);

  if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
    throw new Error(`Unsupported DATABASE_URL protocol "${url.protocol}"`);
  }

  return {
    host: url.hostname || "127.0.0.1",
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\/+/, ""),
    sslHint:
      url.searchParams.get("ssl") === "true" ||
      url.searchParams.get("ssl-mode") === "REQUIRED" ||
      url.searchParams.get("ssl-mode") === "VERIFY_IDENTITY" ||
      url.searchParams.get("sslaccept") === "strict" ||
      url.hostname.includes("tidbcloud.com"),
  };
};

const databaseUrl = process.env.DATABASE_URL?.trim();
const parsedDatabaseUrl = databaseUrl ? parseDatabaseUrl(databaseUrl) : null;

const resolvedHost = parsedDatabaseUrl?.host ?? coalesceEnv("DB_HOST", "TIDB_HOST") ?? "127.0.0.1";
const resolvedPort = parsedDatabaseUrl?.port ?? parseNumber(coalesceEnv("DB_PORT", "TIDB_PORT"), 3306);
const resolvedUser = parsedDatabaseUrl?.user || coalesceEnv("DB_USER", "TIDB_USER") || "root";
const resolvedPassword = parsedDatabaseUrl?.password ?? coalesceEnv("DB_PASSWORD", "TIDB_PASSWORD") ?? "";
const resolvedDatabase =
  parsedDatabaseUrl?.database ||
  coalesceEnv("DB_NAME", "TIDB_DB_NAME", "TIDB_DATABASE") ||
  "cafe_curator";
const inferredCloudSsl = Boolean(
  parsedDatabaseUrl?.sslHint ||
    process.env.TIDB_HOST ||
    resolvedHost.includes("tidbcloud.com") ||
    resolvedPort === 4000,
);

export const dbConfig = {
  host: resolvedHost,
  port: resolvedPort,
  user: resolvedUser,
  password: resolvedPassword,
  database: resolvedDatabase,
  ssl: parseBoolean(coalesceEnv("DB_SSL", "TIDB_SSL"), inferredCloudSsl),
  sslRejectUnauthorized: parseBoolean(coalesceEnv("DB_SSL_REJECT_UNAUTHORIZED"), true),
  sslMinVersion: coalesceEnv("DB_SSL_MIN_VERSION") ?? "TLSv1.2",
};

export const assertSafeDatabaseName = (databaseName) => {
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error(`Unsafe database name "${databaseName}". Use only letters, numbers, and underscores.`);
  }
};

export const buildConnectionOptions = ({ includeDatabase = true, extra = {} } = {}) => ({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  ...(includeDatabase ? { database: dbConfig.database } : {}),
  ...(dbConfig.ssl
    ? {
        ssl: {
          minVersion: dbConfig.sslMinVersion,
          rejectUnauthorized: dbConfig.sslRejectUnauthorized,
        },
      }
    : {}),
  ...extra,
});
