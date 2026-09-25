import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	// Personal folders: each user organises the artefacts they can see.
	pgm.createTable("artefact_folder", {
		id: { type: "text", primaryKey: true },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		name: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
		updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createIndex("artefact_folder", "owner_id");
	// Where a user has filed an artefact. Per user, so org members sharing an
	// artefact can each file it in their own folders.
	pgm.createTable("artefact_folder_entry", {
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		folder_id: { type: "text", notNull: true, references: "artefact_folder", onDelete: "CASCADE" },
	});
	pgm.sql('alter table "artefact_folder_entry" add primary key (user_id, artefact_id)');
	pgm.createIndex("artefact_folder_entry", "folder_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_folder_entry");
	pgm.dropTable("artefact_folder");
}
