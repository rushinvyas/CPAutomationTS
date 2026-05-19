import { setWorldConstructor, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page, chromium, firefox, webkit } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { CucumberAllureWorld } from "allure-cucumberjs";
import { LegacyResourceProvider } from "../utils/LegacyResourceProvider";
import { createScenarioContext, ScenarioContext } from "./ScenarioContext";

export interface ICustomWorld extends CucumberAllureWorld {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  scenario: ScenarioContext;
  init(): Promise<Page>;
  close(): Promise<void>;
  attachText(name: string, content: string): Promise<void>;
  resetScenario(): void;
}

export class CustomWorld extends CucumberAllureWorld implements ICustomWorld {
  private static sharedBrowser?: Browser;
  private static sharedContext?: BrowserContext;
  private static sharedPage?: Page;
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  scenario: ScenarioContext;

  constructor(options: IWorldOptions) {
    super(options);
    this.scenario = createScenarioContext();
  }

  async init(): Promise<Page> {
    if (CustomWorld.sharedPage && CustomWorld.sharedContext && CustomWorld.sharedBrowser) {
      this.browser = CustomWorld.sharedBrowser;
      this.context = CustomWorld.sharedContext;
      this.page = CustomWorld.sharedPage;
      return this.page;
    }

    const browserSettings = LegacyResourceProvider.getBrowserSettings();
    const videosDir = path.resolve(process.cwd(), "artifacts", "videos");
    const browserType = browserSettings.DefaultBrowser.toLowerCase();

    fs.mkdirSync(videosDir, { recursive: true });

    const launcher = browserType === "firefox" ? firefox : browserType === "webkit" ? webkit : chromium;
    const launchArgs = browserType === "chromium" && !browserSettings.Headless ? ["--start-maximized"] : [];

    this.browser = await launcher.launch({
      channel: browserSettings.Channel,
      headless: browserSettings.Headless,
      slowMo: browserSettings.SlowMo,
      args: launchArgs
    });
    this.context = await this.browser.newContext({
      viewport: null,
      recordVideo: { dir: videosDir }
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(browserSettings.Timeout);
    CustomWorld.sharedBrowser = this.browser;
    CustomWorld.sharedContext = this.context;
    CustomWorld.sharedPage = this.page;
    return this.page;
  }

  async close(): Promise<void> {
    this.page = undefined;
    this.context = undefined;
    this.browser = undefined;
  }

  async attachText(name: string, content: string): Promise<void> {
    await this.attach(`${name}: ${content}`, "text/plain");
  }

  resetScenario(): void {
    this.scenario = createScenarioContext();
  }

  static async closeShared(): Promise<void> {
    try {
      await CustomWorld.sharedPage?.close({ runBeforeUnload: false });
    } catch (error) {
      console.warn("Shared page cleanup encountered an error:", error);
    }

    try {
      await CustomWorld.sharedContext?.close();
    } catch (error) {
      console.warn("Shared context cleanup encountered an error:", error);
    }

    try {
      await CustomWorld.sharedBrowser?.close();
    } catch (error) {
      console.warn("Shared browser cleanup encountered an error:", error);
    }

    CustomWorld.sharedPage = undefined;
    CustomWorld.sharedContext = undefined;
    CustomWorld.sharedBrowser = undefined;
  }
}

setWorldConstructor(CustomWorld);
