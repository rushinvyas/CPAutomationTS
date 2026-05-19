"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMethods = void 0;
class CustomMethods {
    static characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    static randomAlphaNumeric(length) {
        let value = "";
        for (let index = 0; index < length; index += 1) {
            const charIndex = Math.floor(Math.random() * this.characters.length);
            value += this.characters[charIndex];
        }
        return value;
    }
    static async isVisible(locator, timeout = 1000) {
        try {
            await locator.waitFor({ state: "visible", timeout });
            return true;
        }
        catch {
            return false;
        }
    }
    static ensureHttps(url) {
        if (/^https?:\/\//i.test(url)) {
            return url;
        }
        return `https://${url}`;
    }
}
exports.CustomMethods = CustomMethods;
