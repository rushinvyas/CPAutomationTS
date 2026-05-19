"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomWorld = void 0;
const cucumber_1 = require("@cucumber/cucumber");
const test_1 = require("@playwright/test");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const allure_cucumberjs_1 = require("allure-cucumberjs");
const LegacyResourceProvider_1 = require("../utils/LegacyResourceProvider");
const ScenarioContext_1 = require("./ScenarioContext");
class CustomWorld extends allure_cucumberjs_1.CucumberAllureWorld {
    static sharedBrowser;
    static sharedContext;
    static sharedPage;
    browser;
    context;
    page;
    scenario;
    constructor(options) {
        super(options);
        this.scenario = (0, ScenarioContext_1.createScenarioContext)();
    }
    async init() {
        if (CustomWorld.sharedPage && CustomWorld.sharedContext && CustomWorld.sharedBrowser) {
            this.browser = CustomWorld.sharedBrowser;
            this.context = CustomWorld.sharedContext;
            this.page = CustomWorld.sharedPage;
            return this.page;
        }
        const browserSettings = LegacyResourceProvider_1.LegacyResourceProvider.getBrowserSettings();
        const videosDir = path.resolve(process.cwd(), "artifacts", "videos");
        const browserType = browserSettings.DefaultBrowser.toLowerCase();
        fs.mkdirSync(videosDir, { recursive: true });
        const launcher = browserType === "firefox" ? test_1.firefox : browserType === "webkit" ? test_1.webkit : test_1.chromium;
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
    async close() {
        this.page = undefined;
        this.context = undefined;
        this.browser = undefined;
    }
    async attachText(name, content) {
        await this.attach(`${name}: ${content}`, "text/plain");
    }
    resetScenario() {
        this.scenario = (0, ScenarioContext_1.createScenarioContext)();
    }
    static async closeShared() {
        try {
            await CustomWorld.sharedPage?.close({ runBeforeUnload: false });
        }
        catch (error) {
            console.warn("Shared page cleanup encountered an error:", error);
        }
        try {
            await CustomWorld.sharedContext?.close();
        }
        catch (error) {
            console.warn("Shared context cleanup encountered an error:", error);
        }
        try {
            await CustomWorld.sharedBrowser?.close();
        }
        catch (error) {
            console.warn("Shared browser cleanup encountered an error:", error);
        }
        CustomWorld.sharedPage = undefined;
        CustomWorld.sharedContext = undefined;
        CustomWorld.sharedBrowser = undefined;
    }
}
exports.CustomWorld = CustomWorld;
(0, cucumber_1.setWorldConstructor)(CustomWorld);
