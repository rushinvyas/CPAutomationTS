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
exports.LegacyResourceProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const KeyVaultService_1 = require("./KeyVaultService");
const ConstantVariables_1 = require("../common/ConstantVariables");
class LegacyResourceProvider {
    static baseConfig = null;
    static envConfig = null;
    static loadedEnvironmentLabel = null;
    static loadJson(fileName) {
        const filePath = path.resolve(process.cwd(), "test-data", fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Legacy resource file not found: ${filePath}`);
        }
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
    static ensureLoaded() {
        if (!this.baseConfig) {
            this.baseConfig = this.loadJson("base.json");
        }
        const environmentLabel = this.getEnvironmentLabel();
        if (!this.envConfig || this.loadedEnvironmentLabel !== environmentLabel) {
            this.envConfig = this.loadJson(`${environmentLabel}.json`);
            this.loadedEnvironmentLabel = environmentLabel;
        }
    }
    static getEnvironmentLabel() {
        if (!this.baseConfig) {
            this.baseConfig = this.loadJson("base.json");
        }
        const rawEnvironment = String(process.env.CP_ENV ??
            process.env.TEST_ENV ??
            this.baseConfig?.environment ??
            "UAT").trim();
        return this.normalizeEnvironmentLabel(rawEnvironment);
    }
    static getEnvironment() {
        return this.getEnvironmentLabel().toUpperCase();
    }
    static get(key) {
        this.ensureLoaded();
        const envOverride = this.getEnvironmentOverride(key);
        if (envOverride !== undefined) {
            return envOverride;
        }
        const envValue = this.envConfig?.[key];
        if (envValue !== undefined) {
            return envValue;
        }
        return this.baseConfig?.[key];
    }
    static getRequired(key) {
        const value = this.get(key);
        if (value === undefined || value === null || value === "") {
            throw new Error(`Missing legacy resource key: ${key}`);
        }
        return value;
    }
    static isAzureEnabled() {
        const value = String(this.get("IsAzure") ?? "No").trim().toLowerCase();
        return value === "yes" || value === "true";
    }
    static async resolveValue(key) {
        const rawValue = String(this.getRequired(key)).trim();
        if (!this.isAzureEnabled()) {
            return rawValue;
        }
        return KeyVaultService_1.KeyVaultService.getSecretWithConfiguration({
            url: this.getRequired("KeyVaultUrl"),
            tenantId: this.get("TenantID"),
            clientId: this.get("ClientID"),
            clientSecret: this.get("ClientSecret")
        }, rawValue);
    }
    static getUrlForScreen(screen) {
        const normalized = screen.trim();
        const key = normalized === ConstantVariables_1.ConstantVariables.Default
            ? "CPURL"
            : normalized === ConstantVariables_1.ConstantVariables.Register
                ? "CPRegisteURL"
                : "CPLoginURL";
        return String(this.getRequired(key)).trim();
    }
    static async getPassword() {
        return this.resolveValue("password");
    }
    static async getUsernameForUserType(userType) {
        const mapping = {
            [ConstantVariables_1.ConstantVariables.HoltCan]: "CPHOLTCandidate",
            [ConstantVariables_1.ConstantVariables.HoltStaff]: "CPHOLTStaffUsername",
            [ConstantVariables_1.ConstantVariables.AgencyUser]: "CPAgencyPersonUsername",
            [ConstantVariables_1.ConstantVariables.ClientPerson]: "CPClientPersonUsername",
            [ConstantVariables_1.ConstantVariables.NewCandidate]: "CPHOLTCandidate"
        };
        const key = mapping[userType];
        if (!key) {
            throw new Error(`No legacy username mapping found for user type: ${userType}`);
        }
        return this.resolveValue(key);
    }
    static async getCandidateEmail() {
        return this.resolveValue("CPHOLTCandidateEmail");
    }
    static async getDatabaseConnectionString() {
        if (this.isAzureEnabled()) {
            return KeyVaultService_1.KeyVaultService.getSecretWithConfiguration({
                url: this.getRequired("KeyVaultUrl"),
                tenantId: this.get("TenantID"),
                clientId: this.get("ClientID"),
                clientSecret: this.get("ClientSecret")
            }, "HOLTDBConnectionString");
        }
        return String(this.getRequired("DbConnectionString")).trim();
    }
    static getBrowserSettings() {
        const requestedBrowser = String(process.env.CP_BROWSER ??
            this.get("browser") ??
            "chromium").trim();
        const headlessValue = String(process.env.CP_HEADLESS ??
            this.get("headless") ??
            "false").trim().toLowerCase();
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
    static normalizeEnvironmentLabel(environment) {
        const trimmed = environment.trim();
        if (!trimmed) {
            return "Uat";
        }
        const lower = trimmed.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
    static getEnvironmentOverride(key) {
        const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
        return process.env[`CP_RESOURCE_${normalizedKey}`] ?? process.env[normalizedKey];
    }
    static normalizeBrowser(browser) {
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
exports.LegacyResourceProvider = LegacyResourceProvider;
