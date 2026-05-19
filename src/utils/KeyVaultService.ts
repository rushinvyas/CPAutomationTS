import { DefaultAzureCredential, ClientSecretCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { LegacyResourceProvider } from "./LegacyResourceProvider";

export class KeyVaultService {
    private static client: SecretClient | null = null;
    private static clients = new Map<string, SecretClient>();

    public static initialize() {
        if (this.client) return;

        const env = LegacyResourceProvider.getEnvironment();
        const url = LegacyResourceProvider.get<string>("KeyVaultUrl");
        const tenantId = LegacyResourceProvider.get<string>("TenantID");
        const clientId = LegacyResourceProvider.get<string>("ClientID");
        const clientSecret = LegacyResourceProvider.get<string>("ClientSecret");

        if (!url) {
            throw new Error(`KeyVault URL not found for environment: ${env}`);
        }

        if (tenantId && clientId && clientSecret) {
            const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            this.client = new SecretClient(url, credential);
        } else {
            this.client = new SecretClient(url, new DefaultAzureCredential());
        }
    }

    public static async getSecret(name: string): Promise<string> {
        this.initialize();
        if (!this.client) throw new Error("Key Vault Client not initialized");
        
        const secret = await this.client.getSecret(name);
        return secret.value || "";
    }

    public static async getSecretFromConfig(keyPath: string): Promise<string> {
        const secretName = LegacyResourceProvider.getRequired<string>(keyPath);

        return this.getSecret(secretName);
    }

    public static getClient(configuration: {
        url: string;
        tenantId?: string;
        clientId?: string;
        clientSecret?: string;
    }): SecretClient {
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

        const client =
            configuration.tenantId && configuration.clientId && configuration.clientSecret
                ? new SecretClient(
                    configuration.url,
                    new ClientSecretCredential(
                        configuration.tenantId,
                        configuration.clientId,
                        configuration.clientSecret
                    )
                )
                : new SecretClient(configuration.url, new DefaultAzureCredential());

        this.clients.set(cacheKey, client);
        return client;
    }

    public static async getSecretWithConfiguration(
        configuration: {
            url: string;
            tenantId?: string;
            clientId?: string;
            clientSecret?: string;
        },
        name: string
    ): Promise<string> {
        const client = this.getClient(configuration);
        const secret = await client.getSecret(name);
        return secret.value || "";
    }
}
