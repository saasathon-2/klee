function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name} (see .env.example)`,
        );
    }
    return value;
}

export const env = {
    port: Number(process.env.PORT ?? 3000),
    databaseUrl: required("DATABASE_URL"),
    betterAuthSecret: required("BETTER_AUTH_SECRET"),
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    openAiApiKey: process.env.OPENAI_API_KEY,
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-6-luna",
    openAiServiceTier: process.env.OPENAI_SERVICE_TIER === "fast" ? "fast" as const : undefined,
    // Trimmed: a stray space pasted into a dashboard breaks the OAuth redirect.
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    githubClientId: process.env.GITHUB_CLIENT_ID?.trim(),
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET?.trim(),
    betterAuthApiKey: process.env.BETTER_AUTH_API_KEY,
    githubAppId: process.env.GITHUB_APP_ID,
    githubPrivateKey: process.env.GITHUB_PRIVATE_KEY,
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    r2Endpoint: process.env.R2_ENDPOINT,
    r2Bucket: process.env.R2_BUCKET,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
};
