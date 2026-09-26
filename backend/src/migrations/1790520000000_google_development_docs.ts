import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("google_development_doc", {
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		document_id: { type: "text", notNull: true },
		title: { type: "text", notNull: true },
		url: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.addConstraint("google_development_doc", "google_development_doc_pk", { primaryKey: ["user_id", "document_id"] });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("google_development_doc");
}
