import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
	pgm.sql('alter table "artefact" add column if not exists "share_id" text');
	pgm.sql('update "artefact" set "share_id" = "id" where "share_id" is null');
	pgm.sql('alter table "artefact" alter column "share_id" set not null');
	pgm.sql('create unique index if not exists "artefact_share_id_key" on "artefact" ("share_id")');
}

export async function down(): Promise<void> {}
