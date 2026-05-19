export class CPLocators {
  public static readonly LOGIN_USERNAME = "id=username";
  public static readonly LOGIN_PASSWORD = "id=password";
  public static readonly LOGIN_BUTTON = "id=login_button";
  public static readonly REGISTER_BUTTON = "css=button[type='submit']";
  public static readonly SIGNOUT_BUTTON = "css=button[title='Sign out']";
  public static readonly LOGIN_ALERT = "class=card login-error";
  public static readonly DYNAMIC_LINK = "xpath=//a[contains(text(),'{0}')]";
  public static readonly HEADING_ONE = "css=h1";
  public static readonly HEADING_TWO = "css=h2";
  public static readonly FORGOT_HEADING_TWO = "css=div.content > h2";
  public static readonly PARAGRAPH = "css=p";
  public static readonly EMAIL_TEXT_BOX = "id=email";
  public static readonly FORGOT_ALERT = "class=error-message";
}
