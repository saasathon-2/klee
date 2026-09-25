import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("artefact", {
		id: { type: "text", primaryKey: true },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		share_id: { type: "text", notNull: true, unique: true },
		prompt: { type: "text", notNull: true },
		title: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
		updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createTable("artefact_revision", {
		id: { type: "text", primaryKey: true },
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		content: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createIndex("artefact", "owner_id");
	pgm.createIndex("artefact_revision", "artefact_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_revision");
	pgm.dropTable("artefact");
}
