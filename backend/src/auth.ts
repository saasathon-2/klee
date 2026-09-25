import { betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { pool } from "./db.ts";
import { env } from "./env.ts";

export const auth = betterAuth({
	database: pool,
	secret: env.betterAuthSecret,
	baseURL: env.betterAuthUrl,
	basePath: "/api/auth",
	trustedOrigins: [env.corsOrigin],
	emailAndPassword: {
		enabled: true,
	},
	account: {
		// Signing in with Google or GitHub joins an existing account with the same email.
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "github"],
		},
	},
	socialProviders: {
		google: {
			clientId: env.googleClientId ?? "",
			clientSecret: env.googleClientSecret ?? "",
		},
		github: {
			clientId: env.githubClientId ?? "",
			clientSecret: env.githubClientSecret ?? "",
			// Added to better-auth's default read:user and user:email scopes, so
			// Klee can see private org membership for artefact access.
			scope: ["read:org"],
		},
	},
	plugins: [dash()],
});
