import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("github_pull_request_artefact", {
		repository: { type: "text", notNull: true },
		pull_request: { type: "integer", notNull: true },
		installation_id: { type: "text", notNull: true, references: "github_installation", onDelete: "CASCADE" },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		comment_id: { type: "text", notNull: true },
		updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.sql('alter table "github_pull_request_artefact" add primary key (repository, pull_request)');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("github_pull_request_artefact");
}
