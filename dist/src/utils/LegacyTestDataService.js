"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyTestDataService = void 0;
const LegacyDbConnection_1 = require("./LegacyDbConnection");
const LegacyQuery_1 = require("./LegacyQuery");
class LegacyTestDataService {
    static async disableOtpIfPossible() {
        await this.runBestEffort(async () => {
            await LegacyDbConnection_1.LegacyDbConnection.executeQuery(LegacyQuery_1.LegacyQuery.updateOtpSetting(1, 0));
        });
    }
    static async enableOtpIfPossible() {
        await this.runBestEffort(async () => {
            await LegacyDbConnection_1.LegacyDbConnection.executeQuery(LegacyQuery_1.LegacyQuery.updateOtpSetting(1, 1));
        });
    }
    static async loadNewCandidateIfPossible(scenario) {
        if (scenario.candidateUsername) {
            return;
        }
        await this.runBestEffort(async () => {
            const rows = await LegacyDbConnection_1.LegacyDbConnection.executeGetQuery(LegacyQuery_1.LegacyQuery.newCandidateDetails());
            const firstRow = rows[0];
            if (!firstRow) {
                return;
            }
            scenario.candidateUsername = firstRow.username
                ? String(firstRow.username)
                : scenario.candidateUsername;
            scenario.candidateId = firstRow.id ? String(firstRow.id) : scenario.candidateId;
        });
    }
    static async runBestEffort(action) {
        try {
            await action();
        }
        catch (error) {
            console.warn("Legacy DB operation skipped:", error);
        }
    }
}
exports.LegacyTestDataService = LegacyTestDataService;
