"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyQuery = void 0;
class LegacyQuery {
    static updateOtpSetting(settingId, value) {
        return `CALL updateotpsetting(${settingId},${value})`;
    }
    static newCandidateDetails() {
        return "CALL newcandidatedtl_get()";
    }
    static getCpTestData(candidateId, field) {
        return `CALL cptestdata_get('${candidateId}', '${field}')`;
    }
    static getCandidateTestData(candidateId) {
        return `CALL cpcandidatetestdata_get('${candidateId}')`;
    }
    static getCpEmail(email) {
        return `CALL cpemail_get('${email}')`;
    }
}
exports.LegacyQuery = LegacyQuery;
