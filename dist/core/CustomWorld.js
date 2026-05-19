"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomWorld = void 0;
const cucumber_1 = require("@cucumber/cucumber");
const test_1 = require("@playwright/test");
class CustomWorld extends cucumber_1.World {
    constructor(options) {
        super(options);
    }
    async init() {
        this.browser = await test_1.chromium.launch({ headless: false });
        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            recordVideo: { dir: "artifacts/videos/" }
        });
        this.page = await this.context.newPage();
        return this.page;
    }
    async close() {
        await this.page?.close();
        await this.context?.close();
        await this.browser?.close();
    }
}
exports.CustomWorld = CustomWorld;
(0, cucumber_1.setWorldConstructor)(CustomWorld);
