import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.addColumn("artefact", {
		is_shared: { type: "boolean", notNull: true, default: false },
	});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
	pgm.dropColumn("artefact", "is_shared");
}
