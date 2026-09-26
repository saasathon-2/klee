import { readdir } from "node:fs/promises";
import { Client } from "pg";

const legacyName = "1790163000000_artefact-unify-id";
const canonicalName = "1790163500000_artefact-unify-id";
const interimName = "1790166000000_artefact-unify-id";
const legacyContentNames = [
	"1790163000000_artefact_content",
	"1790165000000_artefact_content",
];
const contentName = "1790168000000_artefact_content";
const legacyGithubNames = [
	"1790164000000_github-installations",
	"1790165000000_github-installations",
];
const githubName = "1790166000000_github-installations";
const agentSessionName = "1790169000000_artefact_agent_session";
const legacyAgentSessionNames = [
	"1790163990000_artefact_agent_session",
	"1790164000000_artefact_agent_session",
	"1790167000000_artefact_agent_session",
];
const files = await readdir(new URL("../src/migrations/", import.meta.url));
const names = files
	.filter((file) => file.endsWith(".ts"))
	.map((file) => file.slice(0, -3))
	.sort((a, b) => Number(a.split("_")[0]) - Number(b.split("_")[0]));
const prefixes = new Map();

async function normalizeAppliedName(client, appliedNames, oldNames, currentName) {
	const recordedNames = oldNames.filter((name) => appliedNames.has(name));
	if (!recordedNames.length) return;

	const duplicates = appliedNames.has(currentName) ? recordedNames : recordedNames.slice(1);
	if (!appliedNames.has(currentName))
		await client.query("update pgmigrations set name = $1 where name = $2", [currentName, recordedNames[0]]);
	if (duplicates.length)
		await client.query("delete from pgmigrations where name = any($1)", [duplicates]);
	await client.query(
		"delete from pgmigrations where id in (select id from (select id, row_number() over (order by run_on, id) as position from pgmigrations where name = $1) as rows where position > 1)",
		[currentName],
	);
	for (const name of recordedNames) appliedNames.delete(name);
	if (names.includes(currentName)) appliedNames.add(currentName);
}

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
		await normalizeAppliedName(client, appliedNames, legacyGithubNames, githubName);
		await normalizeAppliedName(client, appliedNames, legacyAgentSessionNames, agentSessionName);
		await normalizeAppliedName(client, appliedNames, legacyContentNames, contentName);
		await normalizeAppliedName(client, appliedNames, [legacyName, interimName], canonicalName);
		if (
			!appliedNames.has(canonicalName) &&
			[githubName, contentName, agentSessionName].some((name) => appliedNames.has(name))
		) {
			await client.query('alter table "artefact" add column if not exists "is_shared" boolean not null default false');
			await client.query("insert into pgmigrations (name, run_on) values ($1, now())", [canonicalName]);
			appliedNames.add(canonicalName);
		}
		const missing = [...appliedNames].filter((name) => !names.includes(name));
		if (missing.length)
			throw new Error(`Applied migration files are missing: ${missing.join(", ")}. Restore their original filenames; never rename applied migrations.`);

		const appliedInFileOrder = names.filter((name) => appliedNames.has(name));
		if (appliedInFileOrder.length) {
			const { rows } = await client.query("select min(run_on) as first_run from pgmigrations where name = any($1)", [appliedInFileOrder]);
			const firstRun = new Date(rows[0].first_run).getTime();
			await client.query("begin");
			try {
				for (const [index, name] of appliedInFileOrder.entries())
					await client.query("update pgmigrations set run_on = $1 where name = $2", [new Date(firstRun + index), name]);
				await client.query("commit");
			} catch (error) {
				await client.query("rollback");
				throw error;
			}
		}
	}
} finally {
	await client.end();
}
