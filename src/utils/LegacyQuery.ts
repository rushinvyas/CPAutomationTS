export class LegacyQuery {
  public static updateOtpSetting(settingId: number, value: number): string {
    return `CALL updateotpsetting(${settingId},${value})`;
  }

  public static newCandidateDetails(): string {
    return "CALL newcandidatedtl_get()";
  }

  public static getCpTestData(candidateId: string, field: string): string {
    return `CALL cptestdata_get('${candidateId}', '${field}')`;
  }

  public static getCandidateTestData(candidateId: string): string {
    return `CALL cpcandidatetestdata_get('${candidateId}')`;
  }

  public static getCpEmail(email: string): string {
    return `CALL cpemail_get('${email}')`;
  }
}
