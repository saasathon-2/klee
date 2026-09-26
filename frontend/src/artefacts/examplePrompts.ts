/**
 * Starter prompts for the developer templates. Each one carries complete
 * example data so the matching block can be generated from the prompt alone.
 */
export type ExamplePrompt = {
	id: "code-diff" | "review-comments" | "commit-list" | "example-prompt";
	label: string;
	prompt: string;
};

export const developerExamplePrompts: ExamplePrompt[] = [
	{
		id: "code-diff",
		label: "Code diff",
		prompt: `Show this change to src/auth/session.ts as a code diff and explain what it does.

@@ -12,10 +12,12 @@ export async function createSession(user: User) {
   const now = Date.now();
-  const key = crypto.randomBytes(16).toString("hex");
-  sessions.set(key, user.id);
+  const key = crypto.randomBytes(32).toString("hex");
+  await keyStore.put(key, {
+    userId: user.id,
+    expiresAt: now + SESSION_TTL_MS,
+  });
   audit.log("session.created", { userId: user.id });
   return key;
 }`,
	},
	{
		id: "review-comments",
		label: "Review feedback",
		prompt: `Summarise the reviewer feedback on PR #482 "Linking authentication API to backend" and the overall consensus.

@jane_doe (approved): Looks good overall, but session keys should be rotated when a user logs in again.
@sam_lee (approved): Nice clean-up of the routing layer. Nit: rename "registered" state to "verified" so it matches the UI.
@priya_k (commented): The registered state still renders the old badge colour on the profile page.
@tom_w (approved): Happy to merge once the key rotation follow-up is ticketed.`,
	},
	{
		id: "commit-list",
		label: "Commit timeline",
		prompt: `Walk through the commits on branch feat/auth-api and what each one changed.

a1b2c3d4 @jane_doe: Route auth requests through the API gateway. Moves session validation out of each service and into the gateway middleware.
b5e6f7a8 @jane_doe: Store session keys in the key store. Replaces the in-memory map with the encrypted key store and adds a 24 hour expiry.
c9d0e1f2 @sam_lee: Rename registered state to verified. Updates the enum, API responses, and profile badge copy.
d3a4b5c6 @jane_doe: Add session rotation on login. Old keys are revoked whenever a user signs in again.`,
	},
	{
		id: "example-prompt",
		label: "Large Example",
		prompt: `Summarise the reviewer feedback on PR #482 "Linking authentication API to backend" and the overall consensus.

@jane_doe (approved): Looks good overall, but session keys should be rotated when a user logs in again.
@sam_lee (approved): Nice clean-up of the routing layer. Nit: rename "registered" state to "verified" so it matches the UI.
@priya_k (commented): The registered state still renders the old badge colour on the profile page.
@tom_w (approved): Happy to merge once the key rotation follow-up is ticketed.

System relationships confirmed by the PR:
The auth client sends requests to the API gateway. The gateway validates session keys using the encrypted key store. The login handler creates session keys and writes the user ID and expiry to the key store. Include a component/dependency diagram showing these relationships.

Show this change to src/auth/session.ts as a code diff and explain what it does.

@@ -12,10 +12,12 @@ export async function createSession(user: User) {
   const now = Date.now();
-  const key = crypto.randomBytes(16).toString("hex");
-  sessions.set(key, user.id);
+  const key = crypto.randomBytes(32).toString("hex");
+  await keyStore.put(key, {
+    userId: user.id,
+    expiresAt: now + SESSION_TTL_MS,
+  });
   audit.log("session.created", { userId: user.id });
   return key;
 }

Walk through the commits on branch feat/auth-api and what each one changed.

a1b2c3d4 @jane_doe: Route auth requests through the API gateway. Moves session validation out of each service and into the gateway middleware.
b5e6f7a8 @jane_doe: Store session keys in the key store. Replaces the in-memory map with the encrypted key store and adds a 24 hour expiry.
c9d0e1f2 @sam_lee: Rename registered state to verified. Updates the enum, API responses, and profile badge copy.
d3a4b5c6 @jane_doe: Add session rotation on login. Old keys are revoked whenever a user signs in again.

Summarise these CI check results for PR #482 and whether it is ready to merge.

Unit tests: passed, 412 tests in 1m 48s
Integration tests: passed, 36 tests against staging database
Lint: failed, 2 errors in src/auth/session.ts (unused import, missing return type)
Type check: passed
Security scan: passed, no new vulnerabilities
Preview deploy: pending, queued behind 2 other builds`,
	},
];
