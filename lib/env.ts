const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable ${key}`);
  }

  return value;
};

export const env = {
  dbHost: getEnv("DB_HOST", "127.0.0.1"),
  dbPort: Number(getEnv("DB_PORT", "3306")),
  dbUser: getEnv("DB_USER", "root"),
  dbPassword: getEnv("DB_PASSWORD", ""),
  dbName: getEnv("DB_NAME", "cafe_curator"),
  sessionSecret: getEnv("SESSION_SECRET", "dev-only-secret-change-me"),
};
