import { expect, Locator, Page } from "@playwright/test";
import { CPLocators } from "../locators/CPLocators";
import { ConstantVariables } from "../common/ConstantVariables";
import { CustomMethods } from "../common/CustomMethods";
import { ScenarioContext } from "../core/ScenarioContext";
import { ElementActions } from "../core/ElementActions";
import { LegacyResourceProvider } from "../utils/LegacyResourceProvider";
import { OtpHelper } from "../utils/OtpHelper";

export class CandidateLoginPage {
  private readonly navigationTimeout = 120000;
  private readonly actions: ElementActions;

  constructor(
    private readonly page: Page,
    private readonly scenario: ScenarioContext
  ) {
    this.actions = new ElementActions(page);
  }

  private locator(selector: string): Locator {
    return this.actions.locator(selector);
  }

  private dynamicLink(text: string): Locator {
    return this.locator(CPLocators.DYNAMIC_LINK.replace("{0}", text));
  }

  private async submitForm(): Promise<void> {
    await this.actions.click(CPLocators.REGISTER_BUTTON);
  }

  private async focusLoginFields(username = false, password = false): Promise<void> {
    if (username) {
      await this.actions.focus(CPLocators.LOGIN_USERNAME);
    }

    if (password) {
      await this.actions.focus(CPLocators.LOGIN_PASSWORD);
    }
  }

  private async focusForgotInput(useEmailField: boolean): Promise<void> {
    await this.actions.focus(useEmailField ? CPLocators.EMAIL_TEXT_BOX : CPLocators.LOGIN_USERNAME);
  }

  private async populateLoginCredentials(username: string, password: string): Promise<void> {
    await this.actions.fill(CPLocators.LOGIN_USERNAME, username);
    await this.actions.fill(CPLocators.LOGIN_PASSWORD, password);
  }

  public async openScreen(screen: string): Promise<void> {
    const url = CustomMethods.ensureHttps(LegacyResourceProvider.getUrlForScreen(screen));
    await this.navigateWithFallback(url);

    if (await CustomMethods.isVisible(this.locator(CPLocators.SIGNOUT_BUTTON), 3000)) {
      await this.actions.click(CPLocators.SIGNOUT_BUTTON);
    }

    await this.verifyLoginScreenVisible();
  }

  public async verifyLoginScreenVisible(): Promise<void> {
    await expect(this.locator(CPLocators.LOGIN_USERNAME)).toBeVisible({ timeout: 30000 });
    await expect(this.locator(CPLocators.LOGIN_PASSWORD)).toBeVisible({ timeout: 30000 });
    await expect(this.locator(CPLocators.LOGIN_BUTTON)).toBeVisible({ timeout: 30000 });
  }

  public async login(username: string, password: string): Promise<void> {
    await this.verifyLoginScreenVisible();
    await this.populateLoginCredentials(username, password);
    await this.actions.click(CPLocators.LOGIN_BUTTON);
  }

  public async verifyDashboardOpen(): Promise<void> {
    const otpHeader = this.page.locator("//h1[normalize-space()='Verify OTP']");
    const otpFirstBox = this.page.locator(
      "//div[contains(@class,'otp-inputs')]//input[contains(@class,'otp-box') and not(@disabled)][1]"
    );
    const verifyOtpButton = this.page.locator("//button[@id='verify_otp_button' and @type='submit']");

    if (await CustomMethods.isVisible(otpHeader, 3000)) {
      const otp = await OtpHelper.getOtpForCandidate(await LegacyResourceProvider.getCandidateEmail());
      await otpFirstBox.click();
      await this.page.keyboard.type(otp.replace(/\D/g, ""));
      await verifyOtpButton.click();
    }

    await expect(this.locator(CPLocators.SIGNOUT_BUTTON)).toBeVisible({ timeout: 60000 });
  }

  public async logout(): Promise<void> {
    await this.actions.click(CPLocators.SIGNOUT_BUTTON);
    await this.verifyLoginScreenVisible();
  }

  public async clickButton(button: string, action: string, input: string): Promise<void> {
    const normalizedAction = action.trim().toLowerCase();
    const normalizedInput = input.trim().toLowerCase();
    const candidateUsername = await LegacyResourceProvider.getUsernameForUserType(ConstantVariables.HoltCan);
    const commonPassword = await LegacyResourceProvider.getPassword();

    if (normalizedAction === ConstantVariables.Without) {
      if (
        button.trim() === ConstantVariables.SendEmail &&
        normalizedInput === ConstantVariables.LowerUsername
      ) {
        await this.focusForgotInput(false);
      } else if (normalizedInput === ConstantVariables.Username.toLowerCase()) {
        await this.actions.fill(CPLocators.LOGIN_PASSWORD, commonPassword);
        await this.focusLoginFields(true, false);
      } else if (normalizedInput === ConstantVariables.Password.toLowerCase()) {
        await this.actions.fill(CPLocators.LOGIN_USERNAME, candidateUsername);
        await this.focusLoginFields(false, true);
      } else if (normalizedInput === ConstantVariables.Email.toLowerCase()) {
        await this.focusForgotInput(true);
      } else if (normalizedInput === ConstantVariables.LowerUsername) {
        await this.focusForgotInput(false);
      } else {
        await this.focusLoginFields(true, true);
      }
    } else {
      if (normalizedInput === "wrong username") {
        this.scenario.loginUsername = `CPAutomation.${CustomMethods.randomAlphaNumeric(8)}`;
        this.scenario.loginPassword = commonPassword;
      } else if (normalizedInput === "wrong password") {
        this.scenario.loginUsername = candidateUsername;
        this.scenario.loginPassword = CustomMethods.randomAlphaNumeric(10);
      } else if (normalizedInput === "wrong username and password") {
        this.scenario.loginUsername = `CPAutomation.${CustomMethods.randomAlphaNumeric(8)}`;
        this.scenario.loginPassword = CustomMethods.randomAlphaNumeric(10);
      } else if (normalizedInput === ConstantVariables.Email.toLowerCase()) {
        this.scenario.email = await LegacyResourceProvider.getCandidateEmail();
      } else if (normalizedInput === ConstantVariables.LowerUsername) {
        this.scenario.loginUsername = candidateUsername;
      }

      if (button.trim() === ConstantVariables.SendEmail) {
        const valueToEnter = this.scenario.email ?? this.scenario.loginUsername ?? "";
        const inputLocator =
          normalizedInput === ConstantVariables.Email.toLowerCase()
            ? CPLocators.EMAIL_TEXT_BOX
            : CPLocators.LOGIN_USERNAME;

        await this.actions.clear(inputLocator);
        await this.actions.fill(inputLocator, valueToEnter);
      } else {
        await this.populateLoginCredentials(
          this.scenario.loginUsername ?? "",
          this.scenario.loginPassword ?? ""
        );
      }
    }

    await this.submitForm();
  }

  public async clickLink(linkName: string): Promise<void> {
    this.scenario.selectedLinkName = linkName;
    await this.actions.click(this.dynamicLink(linkName));
  }

  public async verifyAlert(alertType: string): Promise<void> {
    const normalizedAlert = alertType.trim();

    if (normalizedAlert === ConstantVariables.CheckEmail) {
      const headingOne = this.locator(CPLocators.HEADING_ONE);
      const headingTwo = this.locator(CPLocators.FORGOT_HEADING_TWO);
      await expect(headingOne).toHaveText(ConstantVariables.CheckEmail, { timeout: 30000 });

      if (this.scenario.selectedLinkName === ConstantVariables.ForgotUname) {
        await expect(headingTwo).toHaveText(ConstantVariables.ReminderUser);
      } else {
        await expect(headingTwo).toHaveText(ConstantVariables.EmailResetPwd);
      }

      return;
    }

    if (normalizedAlert === ConstantVariables.EmailValidation) {
      await expect(this.locator(CPLocators.FORGOT_ALERT)).toHaveText(
        ConstantVariables.ForgotEmailValidation
      );
      return;
    }

    if (normalizedAlert === ConstantVariables.UsernameValidation) {
      await expect(this.locator(CPLocators.FORGOT_ALERT)).toHaveText(
        ConstantVariables.ForgotUsernameValidation
      );
      return;
    }

    const loginAlert = this.locator(CPLocators.LOGIN_ALERT);

    if (normalizedAlert === ConstantVariables.AgencyAlert) {
      await expect(loginAlert).toHaveText(ConstantVariables.AgencyUnsupported, { timeout: 30000 });
      return;
    }

    if (normalizedAlert === ConstantVariables.ClientAlert) {
      await expect(loginAlert).toHaveText(ConstantVariables.ClientUnsupported, { timeout: 30000 });
      return;
    }

    if (normalizedAlert === ConstantVariables.Error) {
      await expect(loginAlert).toHaveText(ConstantVariables.IncorrectUsernamePassword, {
        timeout: 30000
      });
      return;
    }

    await expect(loginAlert).toHaveText(ConstantVariables.BlankUsernamePassword, { timeout: 30000 });
  }

  public async verifyScreenOpen(linkName: string): Promise<void> {
    const headingOne = this.locator(CPLocators.HEADING_ONE);
    const headingTwo = this.locator(CPLocators.HEADING_TWO);
    const paragraph = this.locator(CPLocators.PARAGRAPH);

    if (linkName === ConstantVariables.ForgotUname) {
      await expect(this.page).toHaveURL(new RegExp(`${ConstantVariables.ForgotUsernamePath}$`));
      await expect(headingOne).toHaveText(ConstantVariables.ForgotUname);
      await expect(headingTwo).toHaveText(ConstantVariables.Reminder);
      await expect(paragraph).toHaveText(ConstantVariables.MessageUsername);
      return;
    }

    await expect(this.page).toHaveURL(new RegExp(`${ConstantVariables.ForgotPasswordPath}$`));
    await expect(headingOne).toHaveText(ConstantVariables.ForgotPwd);
    await expect(headingTwo).toHaveText(ConstantVariables.ResetPwd);
    await expect(paragraph).toHaveText(ConstantVariables.MessagePwd);
  }

  private async navigateWithFallback(url: string): Promise<void> {
    const waitStrategies: Array<"domcontentloaded" | "load" | "commit"> = [
      "domcontentloaded",
      "load",
      "commit"
    ];
    let lastError: unknown;

    for (const waitUntil of waitStrategies) {
      try {
        await this.page.goto(url, {
          waitUntil,
          timeout: this.navigationTimeout
        });
        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`Unable to navigate to ${url}`);
  }
}
