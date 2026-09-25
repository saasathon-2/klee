import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.alterColumn("github_pull_request_artefact", "comment_id", { notNull: false });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.alterColumn("github_pull_request_artefact", "comment_id", { notNull: true });
}
