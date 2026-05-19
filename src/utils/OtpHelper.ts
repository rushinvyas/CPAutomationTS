import mysql, { RowDataPacket } from 'mysql2/promise';
import { LegacyResourceProvider } from './LegacyResourceProvider';

export class OtpHelper {
    private static readonly otpRegex = /Your\s+new\s+login\s+OTP\s+is:\s*(\d{4,8})/i;

    public static async getOtpForCandidate(
        email: string,
        timeoutSeconds = 60,
        pollIntervalMs = 3000
    ): Promise<string> {
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeoutSeconds * 1000) {
            const otp = await this.tryGetLatestOtp(email);

            if (otp) {
                return otp;
            }

            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error(
            `OTP not received for candidate email [${email}] within ${timeoutSeconds} seconds.`
        );
    }

    private static async tryGetLatestOtp(email: string): Promise<string> {
        const connectionString = await LegacyResourceProvider.getDatabaseConnectionString();

        const connection = await mysql.createConnection(connectionString);

        try {
            const [rows] = await connection.execute<RowDataPacket[]>(
                "CALL emailbodybyemail_get(?)",
                [email]
            );

            const resultSets = rows as unknown[];
            const firstResultSet = Array.isArray(resultSets[0])
                ? (resultSets[0] as Array<Record<string, unknown>>)
                : (resultSets as Array<Record<string, unknown>>);
            const firstRow = firstResultSet[0];

            if (!firstRow) {
                return "";
            }

            const rawBody = firstRow.emailbody ?? firstRow.Body;
            const body = typeof rawBody === "string" ? rawBody : "";
            const match = body.match(this.otpRegex);

            return match?.[1] ?? "";
        } finally {
            await connection.end();
        }
    }
}
