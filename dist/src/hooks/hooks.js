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
const cucumber_1 = require("@cucumber/cucumber");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CustomWorld_1 = require("../core/CustomWorld");
const LegacyResourceProvider_1 = require("../utils/LegacyResourceProvider");
// Keep hooks/steps tolerant of slower browser cleanup and post-login transitions.
(0, cucumber_1.setDefaultTimeout)(LegacyResourceProvider_1.LegacyResourceProvider.getBrowserSettings().Timeout + 90_000);
(0, cucumber_1.BeforeAll)(async function () {
    const allureResultsDir = path.resolve(process.cwd(), "allure-results");
    fs.mkdirSync(allureResultsDir, { recursive: true });
    const environmentData = [
        `Environment=${LegacyResourceProvider_1.LegacyResourceProvider.getEnvironment()}`,
        `Portal=${process.env.CP_PORTAL ?? "Not Set"}`,
        `Browser=${LegacyResourceProvider_1.LegacyResourceProvider.getBrowserSettings().BrowserLabel}`,
        `Headless=${LegacyResourceProvider_1.LegacyResourceProvider.getBrowserSettings().Headless}`
    ].join("\n");
    fs.writeFileSync(path.join(allureResultsDir, "environment.properties"), environmentData);
    fs.writeFileSync(path.join(allureResultsDir, "executor.json"), JSON.stringify({
        name: "CP Automation TS",
        type: "local",
        buildName: `${LegacyResourceProvider_1.LegacyResourceProvider.getEnvironment()}-${process.env.CP_PORTAL ?? "ALL"}`,
        reportName: "CP Automation TS Allure Report"
    }, null, 2));
});
(0, cucumber_1.Before)(async function () {
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts", "screenshots"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts", "videos"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "allure-results"), { recursive: true });
    const world = this;
    await world.init();
    if (typeof world.parentSuite === "function") {
        await world.parentSuite("CP Automation TS");
        await world.suite(LegacyResourceProvider_1.LegacyResourceProvider.getEnvironment());
        await world.subSuite(process.env.CP_PORTAL ?? "HOLT");
    }
});
(0, cucumber_1.AfterStep)(async function ({ pickleStep, result }) {
    const world = this;
    if (!world.page || result?.status === cucumber_1.Status.SKIPPED) {
        return;
    }
    try {
        const safeStepName = pickleStep.text.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 80);
        const stepScreenshotPath = path.resolve(process.cwd(), "artifacts", "screenshots", `step_${safeStepName}_${Date.now()}.png`);
        const screenshot = await world.page.screenshot({
            path: stepScreenshotPath,
            fullPage: true
        });
        await world.attach(screenshot, "image/png");
    }
    catch (error) {
        console.warn("Step screenshot encountered an error:", error);
    }
});
(0, cucumber_1.After)({ timeout: LegacyResourceProvider_1.LegacyResourceProvider.getBrowserSettings().Timeout + 90_000 }, async function (scenario) {
    const world = this;
    const isFailed = scenario.result?.status === cucumber_1.Status.FAILED;
    const screenshotPath = path.resolve(process.cwd(), "artifacts", "screenshots", `${scenario.pickle.name.replace(/ /g, "_")}.png`);
    if (isFailed) {
        const screenshot = await world.page?.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        if (screenshot) {
            await world.attach(screenshot, "image/png");
        }
    }
    try {
        await world.close();
    }
    catch (error) {
        console.warn("Browser cleanup encountered an error:", error);
    }
});
(0, cucumber_1.AfterAll)({ timeout: 35_000 }, async function () {
    try {
        await Promise.race([
            CustomWorld_1.CustomWorld.closeShared(),
            new Promise((resolve) => setTimeout(() => {
                console.warn("Shared browser cleanup exceeded 30 seconds and was allowed to continue in background.");
                resolve();
            }, 30_000))
        ]);
    }
    catch (error) {
        console.warn("Shared browser cleanup encountered an error:", error);
    }
});
