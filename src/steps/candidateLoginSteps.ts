import { Given, Then, When } from "@cucumber/cucumber";
import { ICustomWorld } from "../core/CustomWorld";
import { CandidateLoginPage } from "../pages/CandidateLoginPage";
import { ConstantVariables } from "../common/ConstantVariables";
import { LegacyResourceProvider } from "../utils/LegacyResourceProvider";
import { LegacyTestDataService } from "../utils/LegacyTestDataService";

function getPage(world: ICustomWorld): CandidateLoginPage {
  if (!world.page) {
    throw new Error("Browser page not initialized.");
  }

  return new CandidateLoginPage(world.page, world.scenario);
}

Given("I am on CP {word} screen", async function (screen: string) {
  const world = this as ICustomWorld;
  world.resetScenario();
  world.scenario.portal = process.env.CP_PORTAL ?? "HOLT";

  await LegacyTestDataService.disableOtpIfPossible();
  await LegacyTestDataService.loadNewCandidateIfPossible(world.scenario);
  await getPage(world).openScreen(screen);
  await world.attachText("Step Info", `${screen} screen opened successfully.`);
});

When("I am going to login to CP with {string} credentials", async function (userType: string) {
  const world = this as ICustomWorld;
  const loginPage = getPage(world);
  const username =
    userType === ConstantVariables.NewCandidate && world.scenario.candidateUsername
      ? world.scenario.candidateUsername
      : await LegacyResourceProvider.getUsernameForUserType(userType);
  const password = await LegacyResourceProvider.getPassword();

  world.scenario.loginUsername = username;
  world.scenario.loginPassword = password;

  await loginPage.login(username, password);
  await world.attachText("Step Info", `${userType} credentials were submitted.`);
});

Then("I verify the Candidate should be login and Dashboard page should be open", async function () {
  const world = this as ICustomWorld;
  await getPage(world).verifyDashboardOpen();
  await world.attachText("Validation", "Candidate dashboard is displayed.");
});

Then(
  "I verify that {string} should be login and Dashboard page should be open",
  async function (_userType: string) {
    const world = this as ICustomWorld;
    await getPage(world).verifyDashboardOpen();
    await world.attachText("Validation", "Dashboard is displayed successfully.");
  }
);

Then(
  "I verify that {string} should not login and error messages should be display",
  async function (userType: string) {
    const world = this as ICustomWorld;
    const alertType =
      userType === ConstantVariables.AgencyUser
        ? ConstantVariables.AgencyAlert
        : ConstantVariables.ClientAlert;

    await getPage(world).verifyAlert(alertType);
    await world.attachText("Validation", `${userType} login was blocked and expected alert is displayed.`);
  }
);

Then("I verify that user should be logout from CP and redirect to Login page", async function () {
  const world = this as ICustomWorld;
  await getPage(world).logout();
  await LegacyTestDataService.enableOtpIfPossible();
  await world.attachText("Validation", "User is logged out and redirected to login page.");
});

When(
  "I click on LOG IN button {word} inserting {string}",
  async function (action: string, input: string) {
    const world = this as ICustomWorld;
    await getPage(world).clickButton("LOG IN", action, input);
    await world.attachText("Step Info", `LOG IN action completed with ${action} ${input}.`);
  }
);

When(
  "I click on SEND EMAIL button {word} inserting {string}",
  async function (action: string, input: string) {
    const world = this as ICustomWorld;
    await getPage(world).clickButton(ConstantVariables.SendEmail, action, input);
    await world.attachText("Step Info", `SEND EMAIL action completed with ${action} ${input}.`);
  }
);

Then("I verify that {string} messages should be display", async function (alertType: string) {
  const world = this as ICustomWorld;
  await getPage(world).verifyAlert(alertType);
  await world.attachText("Validation", `${alertType} message is displayed as expected.`);
});

When("I am going to click on {string} link", async function (linkName: string) {
  const world = this as ICustomWorld;
  await getPage(world).clickLink(linkName);
  await world.attachText("Step Info", `${linkName} link clicked.`);
});

Then("I verify that {string} screen should be open", async function (linkName: string) {
  const world = this as ICustomWorld;
  await getPage(world).verifyScreenOpen(linkName);
  await world.attachText("Validation", `${linkName} screen is displayed successfully.`);
});
