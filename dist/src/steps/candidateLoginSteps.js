"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const CandidateLoginPage_1 = require("../pages/CandidateLoginPage");
const ConstantVariables_1 = require("../common/ConstantVariables");
const LegacyResourceProvider_1 = require("../utils/LegacyResourceProvider");
const LegacyTestDataService_1 = require("../utils/LegacyTestDataService");
function getPage(world) {
    if (!world.page) {
        throw new Error("Browser page not initialized.");
    }
    return new CandidateLoginPage_1.CandidateLoginPage(world.page, world.scenario);
}
(0, cucumber_1.Given)("I am on CP {word} screen", async function (screen) {
    const world = this;
    world.resetScenario();
    world.scenario.portal = process.env.CP_PORTAL ?? "HOLT";
    await LegacyTestDataService_1.LegacyTestDataService.disableOtpIfPossible();
    await LegacyTestDataService_1.LegacyTestDataService.loadNewCandidateIfPossible(world.scenario);
    await getPage(world).openScreen(screen);
    await world.attachText("Step Info", `${screen} screen opened successfully.`);
});
(0, cucumber_1.When)("I am going to login to CP with {string} credentials", async function (userType) {
    const world = this;
    const loginPage = getPage(world);
    const username = userType === ConstantVariables_1.ConstantVariables.NewCandidate && world.scenario.candidateUsername
        ? world.scenario.candidateUsername
        : await LegacyResourceProvider_1.LegacyResourceProvider.getUsernameForUserType(userType);
    const password = await LegacyResourceProvider_1.LegacyResourceProvider.getPassword();
    world.scenario.loginUsername = username;
    world.scenario.loginPassword = password;
    await loginPage.login(username, password);
    await world.attachText("Step Info", `${userType} credentials were submitted.`);
});
(0, cucumber_1.Then)("I verify the Candidate should be login and Dashboard page should be open", async function () {
    const world = this;
    await getPage(world).verifyDashboardOpen();
    await world.attachText("Validation", "Candidate dashboard is displayed.");
});
(0, cucumber_1.Then)("I verify that {string} should be login and Dashboard page should be open", async function (_userType) {
    const world = this;
    await getPage(world).verifyDashboardOpen();
    await world.attachText("Validation", "Dashboard is displayed successfully.");
});
(0, cucumber_1.Then)("I verify that {string} should not login and error messages should be display", async function (userType) {
    const world = this;
    const alertType = userType === ConstantVariables_1.ConstantVariables.AgencyUser
        ? ConstantVariables_1.ConstantVariables.AgencyAlert
        : ConstantVariables_1.ConstantVariables.ClientAlert;
    await getPage(world).verifyAlert(alertType);
    await world.attachText("Validation", `${userType} login was blocked and expected alert is displayed.`);
});
(0, cucumber_1.Then)("I verify that user should be logout from CP and redirect to Login page", async function () {
    const world = this;
    await getPage(world).logout();
    await LegacyTestDataService_1.LegacyTestDataService.enableOtpIfPossible();
    await world.attachText("Validation", "User is logged out and redirected to login page.");
});
(0, cucumber_1.When)("I click on LOG IN button {word} inserting {string}", async function (action, input) {
    const world = this;
    await getPage(world).clickButton("LOG IN", action, input);
    await world.attachText("Step Info", `LOG IN action completed with ${action} ${input}.`);
});
(0, cucumber_1.When)("I click on SEND EMAIL button {word} inserting {string}", async function (action, input) {
    const world = this;
    await getPage(world).clickButton(ConstantVariables_1.ConstantVariables.SendEmail, action, input);
    await world.attachText("Step Info", `SEND EMAIL action completed with ${action} ${input}.`);
});
(0, cucumber_1.Then)("I verify that {string} messages should be display", async function (alertType) {
    const world = this;
    await getPage(world).verifyAlert(alertType);
    await world.attachText("Validation", `${alertType} message is displayed as expected.`);
});
(0, cucumber_1.When)("I am going to click on {string} link", async function (linkName) {
    const world = this;
    await getPage(world).clickLink(linkName);
    await world.attachText("Step Info", `${linkName} link clicked.`);
});
(0, cucumber_1.Then)("I verify that {string} screen should be open", async function (linkName) {
    const world = this;
    await getPage(world).verifyScreenOpen(linkName);
    await world.attachText("Validation", `${linkName} screen is displayed successfully.`);
});
