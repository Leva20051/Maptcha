import mysql, { type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __cafeCuratorPool__: mysql.Pool | undefined;
}

const pool =
  global.__cafeCuratorPool__ ??
  mysql.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    connectionLimit: 10,
    namedPlaceholders: false,
  });

if (!global.__cafeCuratorPool__) {
  global.__cafeCuratorPool__ = pool;
}

export { pool };

export async function queryRows<T extends RowDataPacket[]>(sql: string, params: any[] = []) {
  const [rows] = await pool.query<T>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket[]>(sql: string, params: any[] = []) {
  const rows = await queryRows<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: any[] = []) {
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
