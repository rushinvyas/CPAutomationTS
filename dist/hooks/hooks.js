"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
(0, cucumber_1.Before)(async function () {
    const world = this;
    await world.init();
});
(0, cucumber_1.After)(async function (scenario) {
    const world = this;
    if (scenario.result?.status === cucumber_1.Status.FAILED) {
        const screenshot = await world.page?.screenshot({
            path: `artifacts/screenshots/${scenario.pickle.name.replace(/ /g, "_")}.png`,
            fullPage: true
        });
        if (screenshot) {
            await world.attach(screenshot, "image/png");
        }
    }
    await world.close();
});
