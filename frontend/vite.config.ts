import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
	// Reads .env and .env.local, so the dev proxy follows the local API address.
	const env = loadEnv(mode, process.cwd());
	return {
		define: {
			__BUILD_VERSION__: JSON.stringify(
				process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
			),
			__BUILD_UPDATED_AT__: JSON.stringify(new Date().toISOString()),
		},
		plugins: [react(), tailwindcss()],
		server: {
			proxy: {
				"/api": env.VITE_API_URL || "http://localhost:3000",
			},
		},
	};
});
