import { readdir } from "node:fs/promises";
import { Client } from "pg";

const legacyName = "1790163000000_artefact-unify-id";
const canonicalName = "1790163500000_artefact-unify-id";
const interimName = "1790166000000_artefact-unify-id";
const contentName = "1790165000000_artefact_content";
const legacyGithubNames = [
	"1790164000000_github-installations",
	"1790165000000_github-installations",
];
const githubName = "1790166000000_github-installations";
const files = await readdir(new URL("../src/migrations/", import.meta.url));
const names = files
	.filter((file) => file.endsWith(".ts"))
	.map((file) => file.slice(0, -3));
const prefixes = new Map();

for (const name of names) {
	const prefix = name.match(/^(\d+)_/)?.[1];
	if (!prefix) throw new Error(`Migration needs a numeric prefix: ${name}`);
	if (prefixes.has(prefix))
		throw new Error(`Duplicate migration prefix ${prefix}: ${prefixes.get(prefix)}, ${name}`);
	prefixes.set(prefix, name);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
	const table = await client.query("select to_regclass('public.pgmigrations') as name");
	if (table.rows[0].name) {
		const applied = await client.query("select name from pgmigrations");
		const appliedNames = new Set(applied.rows.map((row) => row.name));
		for (const legacyGithubName of legacyGithubNames) {
			if (appliedNames.has(legacyGithubName)) {
				await client.query("update pgmigrations set name = $1 where name = $2", [githubName, legacyGithubName]);
				appliedNames.delete(legacyGithubName);
				appliedNames.add(githubName);
			}
		}
		const recordedName = appliedNames.has(legacyName)
			? legacyName
			: appliedNames.has(interimName)
				? interimName
				: undefined;
		if (recordedName && !appliedNames.has(canonicalName)) {
			await client.query("update pgmigrations set name = $1 where name = $2", [canonicalName, recordedName]);
			appliedNames.delete(recordedName);
			appliedNames.add(canonicalName);
		}
		if (
			!appliedNames.has(canonicalName) &&
			appliedNames.has(contentName) &&
			appliedNames.has(githubName)
		) {
			await client.query('alter table "artefact" add column if not exists "is_shared" boolean not null default false');
			await client.query("insert into pgmigrations (name, run_on) values ($1, now())", [canonicalName]);
			appliedNames.add(canonicalName);
		}

		const missing = [...appliedNames].filter((name) => !names.includes(name));
		if (missing.length)
			throw new Error(`Applied migration files are missing: ${missing.join(", ")}. Restore their original filenames; never rename applied migrations.`);
	}
} finally {
	await client.end();
}
