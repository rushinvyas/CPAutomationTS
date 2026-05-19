import mysql, { ConnectionOptions, RowDataPacket } from "mysql2/promise";
import { LegacyResourceProvider } from "./LegacyResourceProvider";

export class LegacyDbConnection {
  private static readonly retryCount = 5;

  private static async createConnection() {
    const connectionString = await LegacyResourceProvider.getDatabaseConnectionString();
    const connectionOptions = this.toMysqlConnectionOptions(connectionString);
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryCount; attempt += 1) {
      try {
        if (typeof connectionOptions === "string") {
          return await mysql.createConnection(connectionOptions);
        }

        return await mysql.createConnection(connectionOptions);
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`Unable to connect to MySQL after ${this.retryCount} attempts. ${String(lastError)}`);
  }

  private static toMysqlConnectionOptions(connectionString: string): string | ConnectionOptions {
    const trimmed = connectionString.trim();

    if (/^mysqls?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (!trimmed.includes("=") || !trimmed.includes(";")) {
      return trimmed;
    }

    const parts = trimmed
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);

    const values = Object.fromEntries(
      parts.map((item) => {
        const separatorIndex = item.indexOf("=");
        const key = separatorIndex >= 0 ? item.slice(0, separatorIndex).trim().toLowerCase() : item.trim().toLowerCase();
        const value = separatorIndex >= 0 ? item.slice(separatorIndex + 1).trim() : "";
        return [key, value];
      })
    );

    const serverValue = values.server || values.host || "localhost";
    const [host, portText] = String(serverValue).split(",");
    const connectTimeout = Number(values["connect timeout"] || values.connecttimeout || 15000);

    return {
      host: host.trim(),
      port: portText ? Number(portText) : 3306,
      user: values.uid || values.user || values.username,
      password: values.password || values.pwd,
      database: values.database,
      connectTimeout: Number.isNaN(connectTimeout) ? 15000 : connectTimeout,
      multipleStatements: true
    };
  }

  public static async executeQuery(query: string): Promise<void> {
    const connection = await this.createConnection();

    try {
      await connection.query(query);
    } finally {
      await connection.end();
    }
  }

  public static async executeGetQuery<T extends RowDataPacket = RowDataPacket>(query: string): Promise<T[]> {
    const connection = await this.createConnection();

    try {
      const [rows] = await connection.query<T[] | T[][]>(query);

      if (Array.isArray(rows) && Array.isArray(rows[0])) {
        return rows[0] as T[];
      }

      return rows as T[];
    } finally {
      await connection.end();
    }
  }
}
