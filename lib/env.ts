const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable ${key}`);
  }

  return value;
};

const coalesceEnv = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];

    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
};

const parseBoolean = (value: string | undefined, fallback: boolean) => {
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

const parseNumber = (value: string | undefined, fallback: number) => {
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric environment value "${value}"`);
  }

  return parsed;
};

const parseDatabaseUrl = (value: string) => {
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
const tidbHost = coalesceEnv("TIDB_HOST");
const tidbPort = coalesceEnv("TIDB_PORT");
const tidbUser = coalesceEnv("TIDB_USER");
const tidbPassword = coalesceEnv("TIDB_PASSWORD");
const tidbDatabase = coalesceEnv("TIDB_DB_NAME", "TIDB_DATABASE");

const resolvedHost = parsedDatabaseUrl?.host ?? coalesceEnv("DB_HOST") ?? tidbHost ?? "127.0.0.1";
const resolvedPort = parsedDatabaseUrl?.port ?? parseNumber(coalesceEnv("DB_PORT") ?? tidbPort, 3306);
const resolvedUser = parsedDatabaseUrl?.user || coalesceEnv("DB_USER") || tidbUser || "root";
const resolvedPassword = parsedDatabaseUrl?.password ?? coalesceEnv("DB_PASSWORD") ?? tidbPassword ?? "";
const resolvedDatabase =
  parsedDatabaseUrl?.database || coalesceEnv("DB_NAME") || tidbDatabase || "cafe_curator";
const inferredCloudSsl = Boolean(
  parsedDatabaseUrl?.sslHint || tidbHost || resolvedHost.includes("tidbcloud.com") || resolvedPort === 4000,
);
const productionPoolSize = process.env.VERCEL ? 1 : 10;

export const env = {
  dbHost: resolvedHost,
  dbPort: resolvedPort,
  dbUser: resolvedUser,
  dbPassword: resolvedPassword,
  dbName: resolvedDatabase,
  dbSsl: parseBoolean(coalesceEnv("DB_SSL", "TIDB_SSL"), inferredCloudSsl),
  dbSslRejectUnauthorized: parseBoolean(coalesceEnv("DB_SSL_REJECT_UNAUTHORIZED"), true),
  dbSslMinVersion: getEnv("DB_SSL_MIN_VERSION", "TLSv1.2"),
  dbConnectionLimit: parseNumber(coalesceEnv("DB_CONNECTION_LIMIT"), productionPoolSize),
  dbMaxIdle: parseNumber(coalesceEnv("DB_MAX_IDLE"), productionPoolSize),
  dbEnableKeepAlive: parseBoolean(coalesceEnv("DB_ENABLE_KEEP_ALIVE"), true),
  sessionSecret: getEnv("SESSION_SECRET", "dev-only-secret-change-me"),
};
