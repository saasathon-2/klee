import type { MigrationBuilder } from 'node-pg-migrate';

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    create table "user" (
      "id" text not null primary key,
      "name" text not null,
      "email" text not null unique,
      "emailVerified" boolean not null,
      "image" text,
      "createdAt" timestamptz default current_timestamp not null,
      "updatedAt" timestamptz default current_timestamp not null
    );

    create table "session" (
      "id" text not null primary key,
      "expiresAt" timestamptz not null,
      "token" text not null unique,
      "createdAt" timestamptz default current_timestamp not null,
      "updatedAt" timestamptz not null,
      "ipAddress" text,
      "userAgent" text,
      "userId" text not null references "user" ("id") on delete cascade
    );

    create table "account" (
      "id" text not null primary key,
      "accountId" text not null,
      "providerId" text not null,
      "userId" text not null references "user" ("id") on delete cascade,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" timestamptz,
      "refreshTokenExpiresAt" timestamptz,
      "scope" text,
      "password" text,
      "createdAt" timestamptz default current_timestamp not null,
      "updatedAt" timestamptz not null
    );

    create table "verification" (
      "id" text not null primary key,
      "identifier" text not null,
      "value" text not null,
      "expiresAt" timestamptz not null,
      "createdAt" timestamptz default current_timestamp not null,
      "updatedAt" timestamptz default current_timestamp not null
    );

    create index "session_userId_idx" on "session" ("userId");
    create index "account_userId_idx" on "account" ("userId");
    create index "verification_identifier_idx" on "verification" ("identifier");
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    drop table "verification";
    drop table "account";
    drop table "session";
    drop table "user";
  `);
}
