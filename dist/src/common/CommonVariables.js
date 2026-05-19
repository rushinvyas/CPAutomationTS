"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonVariables = void 0;
class CommonVariables {
    static xusername;
    static xpassword;
    static username;
    static password;
    static email;
    static firstname;
    static lastname;
    static preferredName;
    static candidateid;
    static linkName;
    static currentAlertContext;
    static resetLoginFlow() {
        this.xusername = undefined;
        this.xpassword = undefined;
        this.password = undefined;
        this.email = undefined;
        this.firstname = undefined;
        this.lastname = undefined;
        this.preferredName = undefined;
        this.linkName = undefined;
        this.currentAlertContext = undefined;
    }
}
exports.CommonVariables = CommonVariables;
