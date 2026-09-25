import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const migrations = "backend/src/migrations";
const files = await readdir(new URL("../src/migrations/", import.meta.url));
const prefixes = new Set();

for (const file of files) {
	if (!file.endsWith(".ts")) continue;
	const match = file.match(/^(\d{13})_[a-z0-9][a-z0-9_-]*\.ts$/);
	if (!match) throw new Error(`Invalid migration filename: ${file}`);
	if (prefixes.has(match[1])) throw new Error(`Duplicate migration prefix: ${match[1]}`);
	prefixes.add(match[1]);
}

const base = process.env.MIGRATIONS_BASE_REF;
if (base) {
	const changed = execFileSync(
		"git",
		["-C", repository, "diff", "--name-status", "--find-renames=100%", `${base}...HEAD`, "--", migrations],
		{ encoding: "utf8" },
	)
		.trim()
		.split("\n")
		.filter(Boolean);
	const immutableChanges = changed.filter((line) => !line.startsWith("A\t"));
	if (immutableChanges.length) {
		throw new Error(
			`Existing migrations are immutable. Add a new migration instead:\n${immutableChanges.join("\n")}`,
		);
	}
}

console.info(`Migration check passed (${prefixes.size} migrations).`);
