"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyVaultService = void 0;
const identity_1 = require("@azure/identity");
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const LegacyResourceProvider_1 = require("./LegacyResourceProvider");
class KeyVaultService {
    static client = null;
    static clients = new Map();
    static initialize() {
        if (this.client)
            return;
        const env = LegacyResourceProvider_1.LegacyResourceProvider.getEnvironment();
        const url = LegacyResourceProvider_1.LegacyResourceProvider.get("KeyVaultUrl");
        const tenantId = LegacyResourceProvider_1.LegacyResourceProvider.get("TenantID");
        const clientId = LegacyResourceProvider_1.LegacyResourceProvider.get("ClientID");
        const clientSecret = LegacyResourceProvider_1.LegacyResourceProvider.get("ClientSecret");
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
    static async getSecretFromConfig(keyPath) {
        const secretName = LegacyResourceProvider_1.LegacyResourceProvider.getRequired(keyPath);
        return this.getSecret(secretName);
    }
    static getClient(configuration) {
        const cacheKey = [
            configuration.url,
            configuration.tenantId ?? "",
            configuration.clientId ?? "",
            configuration.clientSecret ?? ""
        ].join("|");
        const existingClient = this.clients.get(cacheKey);
        if (existingClient) {
            return existingClient;
        }
        const client = configuration.tenantId && configuration.clientId && configuration.clientSecret
            ? new keyvault_secrets_1.SecretClient(configuration.url, new identity_1.ClientSecretCredential(configuration.tenantId, configuration.clientId, configuration.clientSecret))
            : new keyvault_secrets_1.SecretClient(configuration.url, new identity_1.DefaultAzureCredential());
        this.clients.set(cacheKey, client);
        return client;
    }
    static async getSecretWithConfiguration(configuration, name) {
        const client = this.getClient(configuration);
        const secret = await client.getSecret(name);
        return secret.value || "";
    }
}
exports.KeyVaultService = KeyVaultService;
