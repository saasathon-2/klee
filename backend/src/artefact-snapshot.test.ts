import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgres://localhost/test";
process.env.BETTER_AUTH_SECRET = "snapshot-test-secret";

const { snapshotUrl, validSnapshotToken } = await import("./artefact-snapshot.ts");

const shared = new URL(snapshotUrl("https://klee.work", "artefact-1", true));
assert.equal(shared.pathname, "/artefacts/shared/artefact-1");
assert.equal(shared.searchParams.get("preview"), "1");

const privateSnapshot = new URL(snapshotUrl("https://klee.work", "artefact-1", false));
const token = privateSnapshot.searchParams.get("snapshot") ?? undefined;
assert.equal(privateSnapshot.searchParams.get("preview"), "1");
assert.equal(validSnapshotToken("artefact-1", token), true);
assert.equal(validSnapshotToken("another-artefact", token), false);
assert.equal(validSnapshotToken("artefact-1", undefined), false);
