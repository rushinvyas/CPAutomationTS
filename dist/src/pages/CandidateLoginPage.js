"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandidateLoginPage = void 0;
const test_1 = require("@playwright/test");
const CPLocators_1 = require("../locators/CPLocators");
const ConstantVariables_1 = require("../common/ConstantVariables");
const CustomMethods_1 = require("../common/CustomMethods");
const ElementActions_1 = require("../core/ElementActions");
const LegacyResourceProvider_1 = require("../utils/LegacyResourceProvider");
const OtpHelper_1 = require("../utils/OtpHelper");
class CandidateLoginPage {
    page;
    scenario;
    navigationTimeout = 120000;
    actions;
    constructor(page, scenario) {
        this.page = page;
        this.scenario = scenario;
        this.actions = new ElementActions_1.ElementActions(page);
    }
    locator(selector) {
        return this.actions.locator(selector);
    }
    dynamicLink(text) {
        return this.locator(CPLocators_1.CPLocators.DYNAMIC_LINK.replace("{0}", text));
    }
    async submitForm() {
        await this.actions.click(CPLocators_1.CPLocators.REGISTER_BUTTON);
    }
    async focusLoginFields(username = false, password = false) {
        if (username) {
            await this.actions.focus(CPLocators_1.CPLocators.LOGIN_USERNAME);
        }
        if (password) {
            await this.actions.focus(CPLocators_1.CPLocators.LOGIN_PASSWORD);
        }
    }
    async focusForgotInput(useEmailField) {
        await this.actions.focus(useEmailField ? CPLocators_1.CPLocators.EMAIL_TEXT_BOX : CPLocators_1.CPLocators.LOGIN_USERNAME);
    }
    async populateLoginCredentials(username, password) {
        await this.actions.fill(CPLocators_1.CPLocators.LOGIN_USERNAME, username);
        await this.actions.fill(CPLocators_1.CPLocators.LOGIN_PASSWORD, password);
    }
    async openScreen(screen) {
        const url = CustomMethods_1.CustomMethods.ensureHttps(LegacyResourceProvider_1.LegacyResourceProvider.getUrlForScreen(screen));
        await this.navigateWithFallback(url);
        if (await CustomMethods_1.CustomMethods.isVisible(this.locator(CPLocators_1.CPLocators.SIGNOUT_BUTTON), 3000)) {
            await this.actions.click(CPLocators_1.CPLocators.SIGNOUT_BUTTON);
        }
        await this.verifyLoginScreenVisible();
    }
    async verifyLoginScreenVisible() {
        await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.LOGIN_USERNAME)).toBeVisible({ timeout: 30000 });
        await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.LOGIN_PASSWORD)).toBeVisible({ timeout: 30000 });
        await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.LOGIN_BUTTON)).toBeVisible({ timeout: 30000 });
    }
    async login(username, password) {
        await this.verifyLoginScreenVisible();
        await this.populateLoginCredentials(username, password);
        await this.actions.click(CPLocators_1.CPLocators.LOGIN_BUTTON);
    }
    async verifyDashboardOpen() {
        const otpHeader = this.page.locator("//h1[normalize-space()='Verify OTP']");
        const otpFirstBox = this.page.locator("//div[contains(@class,'otp-inputs')]//input[contains(@class,'otp-box') and not(@disabled)][1]");
        const verifyOtpButton = this.page.locator("//button[@id='verify_otp_button' and @type='submit']");
        if (await CustomMethods_1.CustomMethods.isVisible(otpHeader, 3000)) {
            const otp = await OtpHelper_1.OtpHelper.getOtpForCandidate(await LegacyResourceProvider_1.LegacyResourceProvider.getCandidateEmail());
            await otpFirstBox.click();
            await this.page.keyboard.type(otp.replace(/\D/g, ""));
            await verifyOtpButton.click();
        }
        await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.SIGNOUT_BUTTON)).toBeVisible({ timeout: 60000 });
    }
    async logout() {
        await this.actions.click(CPLocators_1.CPLocators.SIGNOUT_BUTTON);
        await this.verifyLoginScreenVisible();
    }
    async clickButton(button, action, input) {
        const normalizedAction = action.trim().toLowerCase();
        const normalizedInput = input.trim().toLowerCase();
        const candidateUsername = await LegacyResourceProvider_1.LegacyResourceProvider.getUsernameForUserType(ConstantVariables_1.ConstantVariables.HoltCan);
        const commonPassword = await LegacyResourceProvider_1.LegacyResourceProvider.getPassword();
        if (normalizedAction === ConstantVariables_1.ConstantVariables.Without) {
            if (button.trim() === ConstantVariables_1.ConstantVariables.SendEmail &&
                normalizedInput === ConstantVariables_1.ConstantVariables.LowerUsername) {
                await this.focusForgotInput(false);
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.Username.toLowerCase()) {
                await this.actions.fill(CPLocators_1.CPLocators.LOGIN_PASSWORD, commonPassword);
                await this.focusLoginFields(true, false);
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.Password.toLowerCase()) {
                await this.actions.fill(CPLocators_1.CPLocators.LOGIN_USERNAME, candidateUsername);
                await this.focusLoginFields(false, true);
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.Email.toLowerCase()) {
                await this.focusForgotInput(true);
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.LowerUsername) {
                await this.focusForgotInput(false);
            }
            else {
                await this.focusLoginFields(true, true);
            }
        }
        else {
            if (normalizedInput === "wrong username") {
                this.scenario.loginUsername = `CPAutomation.${CustomMethods_1.CustomMethods.randomAlphaNumeric(8)}`;
                this.scenario.loginPassword = commonPassword;
            }
            else if (normalizedInput === "wrong password") {
                this.scenario.loginUsername = candidateUsername;
                this.scenario.loginPassword = CustomMethods_1.CustomMethods.randomAlphaNumeric(10);
            }
            else if (normalizedInput === "wrong username and password") {
                this.scenario.loginUsername = `CPAutomation.${CustomMethods_1.CustomMethods.randomAlphaNumeric(8)}`;
                this.scenario.loginPassword = CustomMethods_1.CustomMethods.randomAlphaNumeric(10);
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.Email.toLowerCase()) {
                this.scenario.email = await LegacyResourceProvider_1.LegacyResourceProvider.getCandidateEmail();
            }
            else if (normalizedInput === ConstantVariables_1.ConstantVariables.LowerUsername) {
                this.scenario.loginUsername = candidateUsername;
            }
            if (button.trim() === ConstantVariables_1.ConstantVariables.SendEmail) {
                const valueToEnter = this.scenario.email ?? this.scenario.loginUsername ?? "";
                const inputLocator = normalizedInput === ConstantVariables_1.ConstantVariables.Email.toLowerCase()
                    ? CPLocators_1.CPLocators.EMAIL_TEXT_BOX
                    : CPLocators_1.CPLocators.LOGIN_USERNAME;
                await this.actions.clear(inputLocator);
                await this.actions.fill(inputLocator, valueToEnter);
            }
            else {
                await this.populateLoginCredentials(this.scenario.loginUsername ?? "", this.scenario.loginPassword ?? "");
            }
        }
        await this.submitForm();
    }
    async clickLink(linkName) {
        this.scenario.selectedLinkName = linkName;
        await this.actions.click(this.dynamicLink(linkName));
    }
    async verifyAlert(alertType) {
        const normalizedAlert = alertType.trim();
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.CheckEmail) {
            const headingOne = this.locator(CPLocators_1.CPLocators.HEADING_ONE);
            const headingTwo = this.locator(CPLocators_1.CPLocators.FORGOT_HEADING_TWO);
            await (0, test_1.expect)(headingOne).toHaveText(ConstantVariables_1.ConstantVariables.CheckEmail, { timeout: 30000 });
            if (this.scenario.selectedLinkName === ConstantVariables_1.ConstantVariables.ForgotUname) {
                await (0, test_1.expect)(headingTwo).toHaveText(ConstantVariables_1.ConstantVariables.ReminderUser);
            }
            else {
                await (0, test_1.expect)(headingTwo).toHaveText(ConstantVariables_1.ConstantVariables.EmailResetPwd);
            }
            return;
        }
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.EmailValidation) {
            await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.FORGOT_ALERT)).toHaveText(ConstantVariables_1.ConstantVariables.ForgotEmailValidation);
            return;
        }
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.UsernameValidation) {
            await (0, test_1.expect)(this.locator(CPLocators_1.CPLocators.FORGOT_ALERT)).toHaveText(ConstantVariables_1.ConstantVariables.ForgotUsernameValidation);
            return;
        }
        const loginAlert = this.locator(CPLocators_1.CPLocators.LOGIN_ALERT);
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.AgencyAlert) {
            await (0, test_1.expect)(loginAlert).toHaveText(ConstantVariables_1.ConstantVariables.AgencyUnsupported, { timeout: 30000 });
            return;
        }
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.ClientAlert) {
            await (0, test_1.expect)(loginAlert).toHaveText(ConstantVariables_1.ConstantVariables.ClientUnsupported, { timeout: 30000 });
            return;
        }
        if (normalizedAlert === ConstantVariables_1.ConstantVariables.Error) {
            await (0, test_1.expect)(loginAlert).toHaveText(ConstantVariables_1.ConstantVariables.IncorrectUsernamePassword, {
                timeout: 30000
            });
            return;
        }
        await (0, test_1.expect)(loginAlert).toHaveText(ConstantVariables_1.ConstantVariables.BlankUsernamePassword, { timeout: 30000 });
    }
    async verifyScreenOpen(linkName) {
        const headingOne = this.locator(CPLocators_1.CPLocators.HEADING_ONE);
        const headingTwo = this.locator(CPLocators_1.CPLocators.HEADING_TWO);
        const paragraph = this.locator(CPLocators_1.CPLocators.PARAGRAPH);
        if (linkName === ConstantVariables_1.ConstantVariables.ForgotUname) {
            await (0, test_1.expect)(this.page).toHaveURL(new RegExp(`${ConstantVariables_1.ConstantVariables.ForgotUsernamePath}$`));
            await (0, test_1.expect)(headingOne).toHaveText(ConstantVariables_1.ConstantVariables.ForgotUname);
            await (0, test_1.expect)(headingTwo).toHaveText(ConstantVariables_1.ConstantVariables.Reminder);
            await (0, test_1.expect)(paragraph).toHaveText(ConstantVariables_1.ConstantVariables.MessageUsername);
            return;
        }
        await (0, test_1.expect)(this.page).toHaveURL(new RegExp(`${ConstantVariables_1.ConstantVariables.ForgotPasswordPath}$`));
        await (0, test_1.expect)(headingOne).toHaveText(ConstantVariables_1.ConstantVariables.ForgotPwd);
        await (0, test_1.expect)(headingTwo).toHaveText(ConstantVariables_1.ConstantVariables.ResetPwd);
        await (0, test_1.expect)(paragraph).toHaveText(ConstantVariables_1.ConstantVariables.MessagePwd);
    }
    async navigateWithFallback(url) {
        const waitStrategies = [
            "domcontentloaded",
            "load",
            "commit"
        ];
        let lastError;
        for (const waitUntil of waitStrategies) {
            try {
                await this.page.goto(url, {
                    waitUntil,
                    timeout: this.navigationTimeout
                });
                return;
            }
            catch (error) {
                lastError = error;
            }
        }
        throw lastError instanceof Error
            ? lastError
            : new Error(`Unable to navigate to ${url}`);
    }
}
exports.CandidateLoginPage = CandidateLoginPage;
