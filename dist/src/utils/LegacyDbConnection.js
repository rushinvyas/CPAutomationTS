"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyDbConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const LegacyResourceProvider_1 = require("./LegacyResourceProvider");
class LegacyDbConnection {
    static retryCount = 5;
    static async createConnection() {
        const connectionString = await LegacyResourceProvider_1.LegacyResourceProvider.getDatabaseConnectionString();
        const connectionOptions = this.toMysqlConnectionOptions(connectionString);
        let lastError;
        for (let attempt = 1; attempt <= this.retryCount; attempt += 1) {
            try {
                if (typeof connectionOptions === "string") {
                    return await promise_1.default.createConnection(connectionOptions);
                }
                return await promise_1.default.createConnection(connectionOptions);
            }
            catch (error) {
                lastError = error;
            }
        }
        throw new Error(`Unable to connect to MySQL after ${this.retryCount} attempts. ${String(lastError)}`);
    }
    static toMysqlConnectionOptions(connectionString) {
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
        const values = Object.fromEntries(parts.map((item) => {
            const separatorIndex = item.indexOf("=");
            const key = separatorIndex >= 0 ? item.slice(0, separatorIndex).trim().toLowerCase() : item.trim().toLowerCase();
            const value = separatorIndex >= 0 ? item.slice(separatorIndex + 1).trim() : "";
            return [key, value];
        }));
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
    static async executeQuery(query) {
        const connection = await this.createConnection();
        try {
            await connection.query(query);
        }
        finally {
            await connection.end();
        }
    }
    static async executeGetQuery(query) {
        const connection = await this.createConnection();
        try {
            const [rows] = await connection.query(query);
            if (Array.isArray(rows) && Array.isArray(rows[0])) {
                return rows[0];
            }
            return rows;
        }
        finally {
            await connection.end();
        }
    }
}
exports.LegacyDbConnection = LegacyDbConnection;
