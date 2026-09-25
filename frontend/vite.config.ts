import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
	// Reads .env and .env.local, so the dev proxy follows the local API address.
	const env = loadEnv(mode, process.cwd());
	return {
		plugins: [react(), tailwindcss()],
		server: {
			proxy: {
				"/api": env.VITE_API_URL || "http://localhost:3000",
			},
		},
	};
});
