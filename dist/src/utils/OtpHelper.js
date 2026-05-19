"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpHelper = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const LegacyResourceProvider_1 = require("./LegacyResourceProvider");
class OtpHelper {
    static otpRegex = /Your\s+new\s+login\s+OTP\s+is:\s*(\d{4,8})/i;
    static async getOtpForCandidate(email, timeoutSeconds = 60, pollIntervalMs = 3000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutSeconds * 1000) {
            const otp = await this.tryGetLatestOtp(email);
            if (otp) {
                return otp;
            }
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
        throw new Error(`OTP not received for candidate email [${email}] within ${timeoutSeconds} seconds.`);
    }
    static async tryGetLatestOtp(email) {
        const connectionString = await LegacyResourceProvider_1.LegacyResourceProvider.getDatabaseConnectionString();
        const connection = await promise_1.default.createConnection(connectionString);
        try {
            const [rows] = await connection.execute("CALL emailbodybyemail_get(?)", [email]);
            const resultSets = rows;
            const firstResultSet = Array.isArray(resultSets[0])
                ? resultSets[0]
                : resultSets;
            const firstRow = firstResultSet[0];
            if (!firstRow) {
                return "";
            }
            const rawBody = firstRow.emailbody ?? firstRow.Body;
            const body = typeof rawBody === "string" ? rawBody : "";
            const match = body.match(this.otpRegex);
            return match?.[1] ?? "";
        }
        finally {
            await connection.end();
        }
    }
}
exports.OtpHelper = OtpHelper;
