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
	socialProviders: {
		google: {
			clientId: env.googleClientId ?? "",
			clientSecret: env.googleClientSecret ?? "",
		},
	},
	plugins: [dash()],
});
