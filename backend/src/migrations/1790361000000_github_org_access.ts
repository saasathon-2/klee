import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// GitHub logins a user belongs to: their own login plus every org, refreshed from GitHub.
	pgm.createTable("github_user_org", {
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		org_login: { type: "text", notNull: true },
		refreshed_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.sql('alter table "github_user_org" add primary key (user_id, org_login)');
	pgm.addColumn("artefact", {
		github_installation_id: {
			type: "text",
			references: "github_installation",
			onDelete: "SET NULL",
		},
	});
	pgm.createIndex("artefact", "github_installation_id");
	pgm.sql(`
		update artefact
		set github_installation_id = github_pull_request_artefact.installation_id
		from github_pull_request_artefact
		where github_pull_request_artefact.artefact_id = artefact.id
	`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropColumn("artefact", "github_installation_id");
	pgm.dropTable("github_user_org");
}
