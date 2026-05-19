"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpHelper = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const ConfigProvider_1 = require("./ConfigProvider");
class OtpHelper {
    static async getOtpForCandidate(email) {
        const env = ConfigProvider_1.ConfigProvider.getEnvironment();
        const connectionString = ConfigProvider_1.ConfigProvider.get(`${env}:ConnectionStrings:MySQL_OTP_DB`);
        if (!connectionString) {
            throw new Error(`OTP Connection string not found for env ${env}`);
        }
        const connection = await promise_1.default.createConnection(connectionString);
        try {
            const [rows] = await connection.execute('SELECT Body FROM OtpEmails WHERE Recipient = ? ORDER BY ReceivedAt DESC LIMIT 1', [email]);
            if (rows && rows.length > 0) {
                const body = rows[0].Body;
                const match = body.match(/Your login OTP is: (\d{4,8})/);
                return match ? match[1] : '';
            }
        }
        finally {
            await connection.end();
        }
        return '';
    }
}
exports.OtpHelper = OtpHelper;
