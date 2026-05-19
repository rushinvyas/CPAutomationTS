"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CPLocators = void 0;
class CPLocators {
    static LOGIN_USERNAME = "id=username";
    static LOGIN_PASSWORD = "id=password";
    static LOGIN_BUTTON = "id=login_button";
    static REGISTER_BUTTON = "css=button[type='submit']";
    static SIGNOUT_BUTTON = "css=button[title='Sign out']";
    static LOGIN_ALERT = "class=card login-error";
    static DYNAMIC_LINK = "xpath=//a[contains(text(),'{0}')]";
    static HEADING_ONE = "css=h1";
    static HEADING_TWO = "css=h2";
    static FORGOT_HEADING_TWO = "css=div.content > h2";
    static PARAGRAPH = "css=p";
    static EMAIL_TEXT_BOX = "id=email";
    static FORGOT_ALERT = "class=error-message";
}
exports.CPLocators = CPLocators;
