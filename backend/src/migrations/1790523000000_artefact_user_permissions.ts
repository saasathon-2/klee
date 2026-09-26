import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("artefact_user_permission", {
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		permission: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.sql('alter table "artefact_user_permission" add primary key (artefact_id, user_id)');
	pgm.addConstraint("artefact_user_permission", "artefact_user_permission_level", {
		check: "permission in ('view', 'comment', 'edit')",
	});
	pgm.createIndex("artefact_user_permission", "user_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_user_permission");
}
