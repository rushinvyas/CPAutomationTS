"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyVaultService = void 0;
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const ConfigProvider_1 = require("./ConfigProvider");
class KeyVaultService {
    static initialize() {
        if (this.client)
            return;
        const env = ConfigProvider_1.ConfigProvider.getEnvironment();
        const url = ConfigProvider_1.ConfigProvider.get(`${env}:KeyVault:Url`);
        const tenantId = ConfigProvider_1.ConfigProvider.get(`${env}:KeyVault:TenantId`);
        const clientId = ConfigProvider_1.ConfigProvider.get(`${env}:KeyVault:ClientId`);
        const clientSecret = ConfigProvider_1.ConfigProvider.get(`${env}:KeyVault:ClientSecret`);
        if (!url) {
            throw new Error(`KeyVault URL not found for environment: ${env}`);
        }
        if (tenantId && clientId && clientSecret) {
            const credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
            this.client = new keyvault_secrets_1.SecretClient(url, credential);
        }
        else {
            this.client = new keyvault_secrets_1.SecretClient(url, new identity_1.DefaultAzureCredential());
        }
    }
    static async getSecret(name) {
        this.initialize();
        if (!this.client)
            throw new Error("Key Vault Client not initialized");
        const secret = await this.client.getSecret(name);
        return secret.value || "";
    }
}
exports.KeyVaultService = KeyVaultService;
KeyVaultService.client = null;
