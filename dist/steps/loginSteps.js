"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const LoginPage_1 = require("../pages/LoginPage");
(0, cucumber_1.Given)("I navigate to the CP login page", async function () {
    if (!this.page) {
        throw new Error("Browser page not initialized.");
    }
    const loginPage = new LoginPage_1.LoginPage(this.page);
    await loginPage.navigate("https://compliance-uat.agile-workforce.co.uk/login");
});
(0, cucumber_1.Then)("I should see the username input field", async function () {
    if (!this.page) {
        throw new Error("Browser page not initialized.");
    }
    const loginPage = new LoginPage_1.LoginPage(this.page);
    await loginPage.verifyLoginPageVisible();
});
