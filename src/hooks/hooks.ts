import { BeforeAll, Before, After, AfterAll, AfterStep, Status, setDefaultTimeout } from '@cucumber/cucumber';
import * as fs from "fs";
import * as path from "path";
import { CustomWorld, ICustomWorld } from "../core/CustomWorld";
import { LegacyResourceProvider } from "../utils/LegacyResourceProvider";

// Keep hooks/steps tolerant of slower browser cleanup and post-login transitions.
setDefaultTimeout(LegacyResourceProvider.getBrowserSettings().Timeout + 90_000);

BeforeAll(async function () {
    const allureResultsDir = path.resolve(process.cwd(), "allure-results");
    fs.mkdirSync(allureResultsDir, { recursive: true });

    const environmentData = [
        `Environment=${LegacyResourceProvider.getEnvironment()}`,
        `Portal=${process.env.CP_PORTAL ?? "Not Set"}`,
        `Browser=${LegacyResourceProvider.getBrowserSettings().BrowserLabel}`,
        `Headless=${LegacyResourceProvider.getBrowserSettings().Headless}`
    ].join("\n");

    fs.writeFileSync(path.join(allureResultsDir, "environment.properties"), environmentData);
    fs.writeFileSync(
        path.join(allureResultsDir, "executor.json"),
        JSON.stringify(
            {
                name: "CP Automation TS",
                type: "local",
                buildName: `${LegacyResourceProvider.getEnvironment()}-${process.env.CP_PORTAL ?? "ALL"}`,
                reportName: "CP Automation TS Allure Report"
            },
            null,
            2
        )
    );
});

Before(async function () {
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts", "screenshots"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts", "videos"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "artifacts"), { recursive: true });
    fs.mkdirSync(path.resolve(process.cwd(), "allure-results"), { recursive: true });

    const world = this as ICustomWorld;
    await world.init();

    if (typeof world.parentSuite === "function") {
        await world.parentSuite("CP Automation TS");
        await world.suite(LegacyResourceProvider.getEnvironment());
        await world.subSuite(process.env.CP_PORTAL ?? "HOLT");
    }
});

AfterStep(async function ({ pickleStep, result }) {
    const world = this as ICustomWorld;

    if (!world.page || result?.status === Status.SKIPPED) {
        return;
    }

    try {
        const safeStepName = pickleStep.text.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 80);
        const stepScreenshotPath = path.resolve(
            process.cwd(),
            "artifacts",
            "screenshots",
            `step_${safeStepName}_${Date.now()}.png`
        );

        const screenshot = await world.page.screenshot({
            path: stepScreenshotPath,
            fullPage: true
        });

        await world.attach(screenshot, "image/png");
    } catch (error) {
        console.warn("Step screenshot encountered an error:", error);
    }
});

After({ timeout: LegacyResourceProvider.getBrowserSettings().Timeout + 90_000 }, async function (scenario) {
    const world = this as ICustomWorld;
    const isFailed = scenario.result?.status === Status.FAILED;
    const screenshotPath = path.resolve(
        process.cwd(),
        "artifacts",
        "screenshots",
        `${scenario.pickle.name.replace(/ /g, "_")}.png`
    );
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
    } catch (error) {
        console.warn("Browser cleanup encountered an error:", error);
    }
});

AfterAll({ timeout: 35_000 }, async function () {
    try {
        await Promise.race([
            CustomWorld.closeShared(),
            new Promise<void>((resolve) =>
                setTimeout(() => {
                    console.warn("Shared browser cleanup exceeded 30 seconds and was allowed to continue in background.");
                    resolve();
                }, 30_000)
            )
        ]);
    } catch (error) {
        console.warn("Shared browser cleanup encountered an error:", error);
    }
});
