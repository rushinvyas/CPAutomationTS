import { Locator } from "@playwright/test";

export class CustomMethods {
  private static readonly characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  public static randomAlphaNumeric(length: number): string {
    let value = "";

    for (let index = 0; index < length; index += 1) {
      const charIndex = Math.floor(Math.random() * this.characters.length);
      value += this.characters[charIndex];
    }

    return value;
  }

  public static async isVisible(locator: Locator, timeout = 1000): Promise<boolean> {
    try {
      await locator.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  public static ensureHttps(url: string): string {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `https://${url}`;
  }
}
