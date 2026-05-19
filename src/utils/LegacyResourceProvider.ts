import * as fs from "fs";
import * as path from "path";
import { KeyVaultService } from "./KeyVaultService";
import { ConstantVariables } from "../common/ConstantVariables";

type LegacyConfig = Record<string, unknown>;
type BrowserSettings = {
  DefaultBrowser: string;
  BrowserLabel: string;
  Channel?: string;
  Headless: boolean;
  SlowMo: number;
  Timeout: number;
};

export class LegacyResourceProvider {
  private static baseConfig: LegacyConfig | null = null;
  private static envConfig: LegacyConfig | null = null;
  private static loadedEnvironmentLabel: string | null = null;

  private static loadJson(fileName: string): LegacyConfig {
    const filePath = path.resolve(process.cwd(), "test-data", fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Legacy resource file not found: ${filePath}`);
    }

    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as LegacyConfig;
  }

  private static ensureLoaded(): void {
    if (!this.baseConfig) {
      this.baseConfig = this.loadJson("base.json");
    }

    const environmentLabel = this.getEnvironmentLabel();

    if (!this.envConfig || this.loadedEnvironmentLabel !== environmentLabel) {
      this.envConfig = this.loadJson(`${environmentLabel}.json`);
      this.loadedEnvironmentLabel = environmentLabel;
    }
  }

  public static getEnvironmentLabel(): string {
    if (!this.baseConfig) {
      this.baseConfig = this.loadJson("base.json");
    }

    const rawEnvironment = String(
      process.env.CP_ENV ??
      process.env.TEST_ENV ??
      this.baseConfig?.environment ??
      "UAT"
    ).trim();

    return this.normalizeEnvironmentLabel(rawEnvironment);
  }

  public static getEnvironment(): string {
    return this.getEnvironmentLabel().toUpperCase();
  }

  public static get<T = unknown>(key: string): T | undefined {
    this.ensureLoaded();

    const envOverride = this.getEnvironmentOverride(key);
    if (envOverride !== undefined) {
      return envOverride as T;
    }

    const envValue = this.envConfig?.[key];
    if (envValue !== undefined) {
      return envValue as T;
    }

    return this.baseConfig?.[key] as T | undefined;
  }

  public static getRequired<T = string>(key: string): T {
    const value = this.get<T>(key);

    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing legacy resource key: ${key}`);
    }

    return value;
  }

  public static isAzureEnabled(): boolean {
    const value = String(this.get("IsAzure") ?? "No").trim().toLowerCase();
    return value === "yes" || value === "true";
  }

  public static async resolveValue(key: string): Promise<string> {
    const rawValue = String(this.getRequired(key)).trim();

    if (!this.isAzureEnabled()) {
      return rawValue;
    }

    return KeyVaultService.getSecretWithConfiguration(
      {
        url: this.getRequired("KeyVaultUrl"),
        tenantId: this.get<string>("TenantID"),
        clientId: this.get<string>("ClientID"),
        clientSecret: this.get<string>("ClientSecret")
      },
      rawValue
    );
  }

  public static getUrlForScreen(screen: string): string {
    const normalized = screen.trim();
    const key =
      normalized === ConstantVariables.Default
        ? "CPURL"
        : normalized === ConstantVariables.Register
          ? "CPRegisteURL"
          : "CPLoginURL";

    return String(this.getRequired(key)).trim();
  }

  public static async getPassword(): Promise<string> {
    return this.resolveValue("password");
  }

  public static async getUsernameForUserType(userType: string): Promise<string> {
    const mapping: Record<string, string> = {
      [ConstantVariables.HoltCan]: "CPHOLTCandidate",
      [ConstantVariables.HoltStaff]: "CPHOLTStaffUsername",
      [ConstantVariables.AgencyUser]: "CPAgencyPersonUsername",
      [ConstantVariables.ClientPerson]: "CPClientPersonUsername",
      [ConstantVariables.NewCandidate]: "CPHOLTCandidate"
    };

    const key = mapping[userType];

    if (!key) {
      throw new Error(`No legacy username mapping found for user type: ${userType}`);
    }

    return this.resolveValue(key);
  }

  public static async getCandidateEmail(): Promise<string> {
    return this.resolveValue("CPHOLTCandidateEmail");
  }

  public static async getDatabaseConnectionString(): Promise<string> {
    if (this.isAzureEnabled()) {
      return KeyVaultService.getSecretWithConfiguration(
        {
          url: this.getRequired("KeyVaultUrl"),
          tenantId: this.get<string>("TenantID"),
          clientId: this.get<string>("ClientID"),
          clientSecret: this.get<string>("ClientSecret")
        },
        "HOLTDBConnectionString"
      );
    }

    return String(this.getRequired("DbConnectionString")).trim();
  }

  public static getBrowserSettings(): BrowserSettings {
    const requestedBrowser = String(
      process.env.CP_BROWSER ??
      this.get("browser") ??
      "chromium"
    ).trim();

    const headlessValue = String(
      process.env.CP_HEADLESS ??
      this.get("headless") ??
      "false"
    ).trim().toLowerCase();

    const slowMo = Number(process.env.CP_SLOWMO ?? this.get("slowMo") ?? 0);
    const timeout = Number(process.env.CP_TIMEOUT ?? this.get("timeout") ?? 30000);
    const normalizedBrowser = this.normalizeBrowser(requestedBrowser);

    return {
      DefaultBrowser: normalizedBrowser.browserType,
      BrowserLabel: normalizedBrowser.label,
      Channel: normalizedBrowser.channel,
      Headless: headlessValue === "true" || headlessValue === "yes" || headlessValue === "1",
      SlowMo: Number.isNaN(slowMo) ? 0 : slowMo,
      Timeout: Number.isNaN(timeout) ? 30000 : timeout
    };
  }

  private static normalizeEnvironmentLabel(environment: string): string {
    const trimmed = environment.trim();

    if (!trimmed) {
      return "Uat";
    }

    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  private static getEnvironmentOverride(key: string): string | undefined {
    const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
    return process.env[`CP_RESOURCE_${normalizedKey}`] ?? process.env[normalizedKey];
  }

  private static normalizeBrowser(browser: string): {
    browserType: "chromium" | "firefox" | "webkit";
    channel?: string;
    label: string;
  } {
    const normalized = browser.trim().toLowerCase();

    switch (normalized) {
      case "chrome":
      case "googlechrome":
      case "google chrome":
        return { browserType: "chromium", channel: "chrome", label: "Chrome" };
      case "edge":
      case "msedge":
      case "microsoftedge":
      case "microsoft edge":
        return { browserType: "chromium", channel: "msedge", label: "Edge" };
      case "firefox":
        return { browserType: "firefox", label: "Firefox" };
      case "webkit":
      case "safari":
        return { browserType: "webkit", label: "Webkit" };
      case "chromium":
      default:
        return { browserType: "chromium", label: "Chromium" };
    }
  }
}
