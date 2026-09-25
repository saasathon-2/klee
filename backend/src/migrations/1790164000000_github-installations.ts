import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.createTable("github_installation", {
		installation_id: { type: "text", primaryKey: true },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		account_login: { type: "text", notNull: true },
		account_type: { type: "text", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
		updated_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
	pgm.createIndex("github_installation", "owner_id");
	pgm.createTable("github_installation_state", {
		state: { type: "text", primaryKey: true },
		owner_id: { type: "text", notNull: true, references: '"user"', onDelete: "CASCADE" },
		expires_at: { type: "timestamptz", notNull: true },
		created_at: { type: "timestamptz", notNull: true, default: pgm.func("current_timestamp") },
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropTable("github_installation_state");
	pgm.dropTable("github_installation");
}
