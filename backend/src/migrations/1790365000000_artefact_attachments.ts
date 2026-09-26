import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// PDFs uploaded in the chat. `artefact_id` stays null until a generation
	// uses the file; unclaimed uploads are cleaned up after a day.
	pgm.createTable("artefact_attachment", {
		id: { type: "text", primaryKey: true },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		artefact_id: { type: "text", references: "artefact", onDelete: "CASCADE" },
		filename: { type: "text", notNull: true },
		content_type: { type: "text", notNull: true },
		size_bytes: { type: "integer", notNull: true },
		page_count: { type: "integer", notNull: true },
		storage_key: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createIndex("artefact_attachment", "artefact_id");
	pgm.createIndex("artefact_attachment", ["owner_id", "created_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_attachment");
}
