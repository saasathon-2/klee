import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("artefact_comment", {
		id: { type: "text", primaryKey: true },
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		parent_id: { type: "text", references: "artefact_comment", onDelete: "CASCADE" },
		author_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		body: { type: "text", notNull: true },
		anchor: { type: "jsonb" },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createIndex("artefact_comment", ["artefact_id", "created_at"]);
	pgm.createIndex("artefact_comment", "parent_id");
	pgm.createTable("artefact_comment_reaction", {
		comment_id: { type: "text", notNull: true, references: "artefact_comment", onDelete: "CASCADE" },
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		emoji: { type: "text", notNull: true },
	});
	pgm.addConstraint("artefact_comment_reaction", "artefact_comment_reaction_pkey", {
		primaryKey: ["comment_id", "user_id", "emoji"],
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_comment_reaction");
	pgm.dropTable("artefact_comment");
}
