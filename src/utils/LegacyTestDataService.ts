import { RowDataPacket } from "mysql2/promise";
import { ScenarioContext } from "../core/ScenarioContext";
import { LegacyDbConnection } from "./LegacyDbConnection";
import { LegacyQuery } from "./LegacyQuery";

type CandidateRow = RowDataPacket & {
  username?: string;
  id?: string | number;
};

export class LegacyTestDataService {
  public static async disableOtpIfPossible(): Promise<void> {
    await this.runBestEffort(async () => {
      await LegacyDbConnection.executeQuery(LegacyQuery.updateOtpSetting(1, 0));
    });
  }

  public static async enableOtpIfPossible(): Promise<void> {
    await this.runBestEffort(async () => {
      await LegacyDbConnection.executeQuery(LegacyQuery.updateOtpSetting(1, 1));
    });
  }

  public static async loadNewCandidateIfPossible(scenario: ScenarioContext): Promise<void> {
    if (scenario.candidateUsername) {
      return;
    }

    await this.runBestEffort(async () => {
      const rows = await LegacyDbConnection.executeGetQuery<CandidateRow>(LegacyQuery.newCandidateDetails());
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

  private static async runBestEffort(action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error) {
      console.warn("Legacy DB operation skipped:", error);
    }
  }
}
