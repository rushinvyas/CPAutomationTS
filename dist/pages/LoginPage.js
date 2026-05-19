"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
const test_1 = require("@playwright/test");
class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameInput = page.locator("#username");
        this.passwordInput = page.locator("#password");
        this.loginButton = page.locator("#login_button");
        this.loginTextOnPage = page.locator("//h1[normalize-space()='Log in']");
    }
    async navigate(url) {
        await this.page.goto(url);
        await this.verifyLoginPageVisible();
    }
    async login(user, pass) {
        await this.usernameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }
    async verifyLoginPageVisible() {
        await (0, test_1.expect)(this.usernameInput).toBeVisible({ timeout: 15000 });
    }
}
exports.LoginPage = LoginPage;
