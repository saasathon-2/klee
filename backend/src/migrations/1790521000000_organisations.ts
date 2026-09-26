import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("organisation", {
		id: { type: "text", primaryKey: true },
		name: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createTable("organisation_member", {
		organisation_id: { type: "text", notNull: true, references: "organisation", onDelete: "CASCADE" },
		user_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		role: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.sql('alter table "organisation_member" add primary key (organisation_id, user_id)');
	pgm.addConstraint("organisation_member", "organisation_member_role", {
		check: "role in ('owner', 'admin', 'member')",
	});
	pgm.createIndex("organisation_member", "user_id");
	pgm.createTable("artefact_organisation_permission", {
		artefact_id: { type: "text", notNull: true, references: "artefact", onDelete: "CASCADE" },
		organisation_id: { type: "text", notNull: true, references: "organisation", onDelete: "CASCADE" },
		permission: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.sql('alter table "artefact_organisation_permission" add primary key (artefact_id, organisation_id)');
	pgm.addConstraint("artefact_organisation_permission", "artefact_organisation_permission_level", {
		check: "permission in ('view', 'comment', 'edit')",
	});
	pgm.createIndex("artefact_organisation_permission", "organisation_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("artefact_organisation_permission");
	pgm.dropTable("organisation_member");
	pgm.dropTable("organisation");
}
