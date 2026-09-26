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
	// Send sign-in failures (e.g. a cancelled or expired OAuth flow) back to the
	// web app's sign-in modal rather than the API's own error page.
	onAPIError: {
		errorURL: `${env.corsOrigin}/?auth=signin`,
	},
	emailAndPassword: {
		enabled: true,
	},
	account: {
		// Signing in with Google or GitHub joins an existing account with the same email.
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "github"],
			// A GitHub identity is used for organisation membership and may use a
			// different (for example, work) email from the Klee login.
			allowDifferentEmails: true,
			// Klee doesn't send verification emails, so password accounts are never
			// verified. Let Google/GitHub (which verify the email) sign straight in.
			requireLocalEmailVerified: false,
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
