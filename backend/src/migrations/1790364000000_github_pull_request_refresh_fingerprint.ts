import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.addColumn("github_pull_request_artefact", {
		context_hash: { type: "text" },
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropColumn("github_pull_request_artefact", "context_hash");
}
