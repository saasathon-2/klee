import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("artefact_version", {
		id: { type: "text", primaryKey: true },
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		version: { type: "integer", notNull: true },
		// Null for system changes such as GitHub pull request refreshes.
		author_id: { type: "text", references: '"user"', onDelete: "SET NULL" },
		source: { type: "text", notNull: true },
		// Forward diff from the previous version; version 1 replaces the whole document.
		patch: { type: "jsonb", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.addConstraint("artefact_version", "artefact_version_linear", {
		unique: ["artefact_id", "version"],
	});
	pgm.sql(`
		insert into artefact_version (id, artefact_id, version, author_id, source, patch, created_at)
		select gen_random_uuid()::text, id, 1, owner_id, 'generated',
			jsonb_build_array(jsonb_build_object('op', 'replace', 'path', '[]'::jsonb, 'value', content)),
			created_at
		from artefact
		where content is not null
	`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_version");
}
