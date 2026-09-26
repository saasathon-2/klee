/**
 * Starter prompts for the developer templates. Each one carries complete
 * example data so the matching block can be generated from the prompt alone.
 */
export type ExamplePrompt = {
	id:
		| "code-diff"
		| "review-comments"
		| "commit-list"
		| "check-list"
		| "god-prompt"
		| "sprint-status"
		| "branch-history"
		| "release-readiness"
		| "incident-review"
		| "architecture-decision"
		| "on-call-handoff"
		| "two-column"
		| "electrical-god-prompt"
		| "civil-god-prompt"
		| "chemistry-god-prompt"
		| "maths-god-prompt";
	label: string;
	prompt: string;
	/** A PDF from `public/` attached alongside the prompt. */
	attachment?: { url: string; filename: string };
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
		id: "check-list",
		label: "CI checks",
		prompt: `Summarise these CI check results for PR #482 and whether it is ready to merge.

Unit tests: passed, 412 tests in 1m 48s
Integration tests: passed, 36 tests against staging database
Lint: failed, 2 errors in src/auth/session.ts (unused import, missing return type)
Type check: passed
Security scan: passed, no new vulnerabilities
Preview deploy: pending, queued behind 2 other builds`,
	},

	{
		id: "god-prompt",
		label: "God Prompt",
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
	{
		id: "sprint-status",
		label: "Sprint status",
		prompt: `Are we on track for Sprint 42? Show the sprint timeline, overall progress, and a triage board.

Sprint 42 runs 2026-09-21 to 2026-10-02. Today is 2026-09-26. Milestones: code freeze 2026-09-30, sprint demo 2026-10-02.
Scope was 34 points at planning; AUTH-58 (6 pts) was added on day 3 and two polish tickets (2 pts) were removed.
Forecast completion: 2026-10-03.

AUTH-40 Session key rotation, Jane Doe, 3 pts, done, 2026-09-21 to 2026-09-23
AUTH-44 Gateway auth middleware, Jane Doe, 5 pts, in progress, 2026-09-23 to 2026-09-29, priority high
AUTH-49 Profile badge still shows old colour, Priya K, 1 pt, blocked waiting on design, 2026-09-25 to 2026-09-27, priority urgent
AUTH-51 Rename registered state to verified, Sam Lee, 2 pts, to do, 2026-09-29 to 2026-10-01, priority medium
AUTH-58 Load test key store, unassigned, 6 pts, to do, not scheduled, priority low
AUTH-37 Audit log for session events, Tom W, 3 pts, done
AUTH-42 Remove legacy session map, Jane Doe, 2 pts, done

Points by state: 18 done, 8 in progress, 3 blocked, 11 not started.`,
	},
	{
		id: "branch-history",
		label: "Branch history",
		prompt: `Show how feat/auth-api and fix/badge were merged into main as a git graph, newest first.

Branches: main, feat/auth-api, fix/badge.

f00dbabe on main by priya_k, 2026-09-26T10:00:00Z: Merge fix/badge. Parents: e11c0de1, c0ffee22.
e11c0de1 on main by jane_doe, 2026-09-25T16:00:00Z: Merge feat/auth-api. Parents: a1b2c3d4, d3a4b5c6.
c0ffee22 on fix/badge by priya_k, 2026-09-25T12:00:00Z: Fix profile badge colour. Parent: a1b2c3d4.
d3a4b5c6 on feat/auth-api by jane_doe, 2026-09-24T12:00:00Z: Add session rotation on login. Parent: b5e6f7a8.
b5e6f7a8 on feat/auth-api by jane_doe, 2026-09-23T12:00:00Z: Store session keys in the key store. Parent: a1b2c3d4.
a1b2c3d4 on main by tom_w, 2026-09-22T09:00:00Z: Release 1.8.0. Parent: 9f8e7d6c.`,
	},
	{
		id: "release-readiness",
		label: "Release readiness",
		prompt: `Can release v1.9.0 go past the canary? Show the rollout timeline, a readiness decision, what the release touches, and who owns it.

Rollout so far:
2026-09-26T09:10:00Z build and sign: succeeded, 412 tests passed
2026-09-26T09:40:00Z deploy to staging: succeeded, smoke tests green
2026-09-26T11:00:00Z canary on production at 10% traffic: in progress, runs for 2 hours
2026-09-26T14:00:00Z error budget gate on production: pending

Gates for full rollout: unit tests passed; integration tests passed; error budget check pending; release notes approved by product.
Advisory: security scan clean; key store write latency up 18% on the canary.
Blocker: none recorded.

Confirmed by the release PR: the auth client calls the API gateway (unchanged). The API gateway now validates sessions and reads from the encrypted key store (modified, owned by Platform). A new login handler writes session keys to the key store (added, owned by Identity). The key store's new 24 hour expiry raises write load (at risk, owned by Data).

Services:
auth-gateway, owner Platform, repo https://github.com/acme/auth-gateway, runbook https://wiki.acme.dev/runbooks/auth-gateway, on call Tom W, production, degraded
key-store, owner Data, repo acme/key-store, on call Ana R, production, healthy
login-service, owner Identity, repo acme/login-service, on call Sam Lee, production, healthy`,
	},
	{
		id: "incident-review",
		label: "Incident review",
		prompt: `Summarise incident INC-311 with a timeline, the error-rate trend, and a risk register for the follow-up work. Keep confirmed and suspected causes separate.

Started 2026-09-24T13:02:00Z, resolved 2026-09-24T14:47:00Z. Impact: 12% of sign-ins failed in eu-west for 1h 45m.

12:55 deploy: gateway 1.8.3 rolled out to eu-west. Timing matches, not yet proven as the cause.
13:02 critical alert: login error rate above 10% (auth-gateway 5xx SLO alert).
13:20 update: on-call confirmed key store connections were saturated at 100% of the pool.
13:40 mitigation: rolled gateway back to 1.8.2.
14:47 resolution: error rate back under 0.5%.
Root cause (suspected): the new 24 hour key expiry exhausts the key store connection pool.

Daily login error rate (%), eu-west: 09-18 0.4, 09-19 0.5, 09-20 0.4, 09-21 0.6, 09-22 0.5, 09-23 0.7, 09-24 12.1, 09-25 0.8, 09-26 0.5
us-east: 09-18 0.3, 09-19 0.3, 09-20 0.4, 09-21 0.3, 09-22 0.4, 09-23 0.3, 09-24 1.2, 09-25 0.4, 09-26 0.3

Follow-ups and risks:
Add pool saturation alert, owner Data, open.
Key store write capacity may not survive peak: high impact, medium likelihood, owner Data, mitigation load test at 3x peak before re-release, mitigating.
Assumption that clients send one key per session: high impact, high likelihood, no owner yet, mitigation confirm with mobile team logs, open.
Dependency on design sign-off for the badge fix: low impact, high likelihood, owner Design, mitigation ship behind a flag, open.`,
	},
	{
		id: "architecture-decision",
		label: "Decision record",
		prompt: `Write up our decision on where sessions are validated, and include a table of the evidence we used.

Question: should each service validate sessions itself, or should the API gateway do it once?
Option 1, gateway middleware. Pros: one implementation, easier key rotation. Cons: the gateway becomes the critical path.
Option 2, per-service library. Pros: no single point of failure. Cons: six copies to upgrade, drift between services.
Decision: validate sessions once in the API gateway. Status: accepted. Review on 2027-01-15.
Rationale: key rotation needs one enforcement point, and the gateway already sits on every request.
Consequences: the gateway latency budget drops by 5 ms; services must trust the forwarded user header.

Evidence:
PR #482 | Code review | Changes requested | 2026-09-26 | https://github.com/acme/auth-gateway/pull/482
INC-311 | Incident | Resolved | 2026-09-24
AUTH-44 | Ticket | In progress | 2026-09-25
Gateway latency dashboard | Metrics | p95 41 ms | 2026-09-26`,
	},
	{
		id: "on-call-handoff",
		label: "On-call handoff",
		prompt: `Write my on-call handoff from Tom W to Ana R. Overall we are at risk.

Done: rolled back gateway 1.8.3 (error rate normal again); filed INC-311 follow-ups.
In flight: canary of v1.9.0 at 10% traffic, owned by Tom W; key store load test, owned by Data.
Watch: key store connection pool at 82% at peak; release notes still waiting for product approval.
Next for Ana: run the 14:00 error budget gate; page Data if the pool exceeds 90%; promote the canary to 50% only if the gate passes.`,
	},
	{
		id: "two-column",
		label: "Chart beside table",
		prompt: `Show last week's deploy failures in a two-column layout: an activity-trend chart of failures per day on the left and an evidence-table of the failed deploys on the right, side by side in one row. This is an example of the two-column layout.

Failed production deploys per day: 2026-09-20 1, 2026-09-21 0, 2026-09-22 2, 2026-09-23 0, 2026-09-24 3, 2026-09-25 1, 2026-09-26 0.

Failed deploys:
2026-09-20 | auth-gateway 1.8.1 | Health check timeout | Rolled back
2026-09-22 | key-store 2.4.0 | Migration lock held | Retried
2026-09-22 | login-service 3.1.2 | Missing secret | Rolled back
2026-09-24 | auth-gateway 1.8.3 | 5xx spike in eu-west | Rolled back
2026-09-24 | auth-gateway 1.8.3 | 5xx spike in us-east | Rolled back
2026-09-24 | billing-api 5.0.0 | Canary error budget | Halted
2026-09-25 | key-store 2.4.1 | Disk pressure | Retried`,
	},
	{
		id: "electrical-god-prompt",
		label: "Electrical God Prompt",
		prompt:
			"Make a quick-reference artefact for the UC3843 from the attached datasheet: headline limits, key electrical specifications for both part grades, the pinout for every package, the oscillator and error amplifier curves, a comparison of the UC3842 to UC3845 variants, and the offline flyback application schematic.",
		attachment: { url: "/examples/uc3843-datasheet.pdf", filename: "UC3843 datasheet.pdf" },
	},
	{
		id: "civil-god-prompt",
		label: "Civil God Prompt",
		prompt: `Make a design brief for the ground-floor transfer beam B3 and the ground at the site, from the calculation and site investigation below.

Beam B3: simply supported, span 8.0 m, pinned support at 0 m and roller at 8.0 m.
Loads: uniformly distributed load 10 kN/m over the full span (including self-weight); point load 40 kN at 3.0 m from the pinned support (column C7).
Reactions: 65 kN at the pinned support, 55 kN at the roller.
Shear force (kN): 65 at 0 m; 35 at 3.0 m just left of the point load; -5 at 3.0 m just right of it; -55 at 8.0 m.
Bending moment (kN·m): 0 at 0 m, 60 at 1 m, 110 at 2 m, 150 at 3 m, 140 at 4 m, 120 at 5 m, 90 at 6 m, 50 at 7 m, 0 at 8 m.
Maximum moment 150 kN·m at 3.0 m, where the shear changes sign.

Section: 457 x 191 x 67 UKB, S355. Moment resistance 519 kN·m; shear resistance 710 kN. Utilisation: bending 0.29, shear 0.08. Deflection under imposed load 11 mm against a span/360 limit of 22 mm.

Borehole BH2 (ground level 24.60 m AOD), depths in m below ground:
0.00-0.30 topsoil: dark brown sandy topsoil with rootlets.
0.30-1.80 made ground: brick and concrete fragments in a clayey sand matrix.
1.80-4.50 clay: firm to stiff brown mottled grey silty CLAY.
4.50-7.20 sand: medium dense orange-brown fine to medium SAND.
7.20-9.00 gravel: dense brown sandy subangular to rounded GRAVEL.
9.00-10.50 rock: weak grey MUDSTONE, highly weathered.
Groundwater struck at 3.10 m.
SPT N values: 2.0 m N=8; 3.5 m N=12; 5.0 m N=18; 6.5 m N=24; 8.0 m N=38; 9.5 m N=50.

Show the beam loading with its shear force and bending moment diagrams, the borehole log with the SPT values, and the beam's utilisation. This is an example.`,
	},
	{
		id: "chemistry-god-prompt",
		label: "Chemistry God Prompt",
		prompt: `Write up this aspirin synthesis as a lab summary: the reaction scheme, the characterisation spectra with assignments, and the product's properties.

Reaction: salicylic acid (C7H6O3) + acetic anhydride ((CH3CO)2O) -> acetylsalicylic acid (C9H8O4) + acetic acid (CH3COOH). Conditions: H3PO4 (cat.), 85 °C, 15 min. Isolated yield 78% after recrystallisation from ethanol/water.
Quench: excess acetic anhydride + H2O -> 2 CH3COOH, added water at room temperature.

1H NMR (400 MHz, CDCl3), δ ppm: 11.0 (br s, 1H, COOH, intensity 25); 8.12 (dd, 1H, H-6, intensity 45); 7.61 (td, 1H, H-4, intensity 45); 7.35 (td, 1H, H-5, intensity 45); 7.13 (dd, 1H, H-3, intensity 45); 2.36 (s, 3H, OCOCH3, intensity 100).

IR (ATR), cm-1, relative band depth: 2900 broad O-H stretch of the carboxylic acid (55); 1750 ester C=O stretch (95); 1680 carboxylic acid C=O stretch (90); 1605 aromatic C=C stretch (50); 1180 ester C-O stretch (75); 750 ortho-disubstituted ring C-H bend (60).

Product: white crystalline solid, m.p. 134-136 °C (literature 135 °C), molar mass 180.16 g/mol, 1.2 g recovered from 1.0 g salicylic acid. Ferric chloride test negative, so no salicylic acid remains. This is an example.`,
	},
	{
		id: "maths-god-prompt",
		label: "Maths God Prompt",
		prompt: `Work through the calculus of f(x) = x^3 - 3x^2 - 9x + 5 as a worked solution, and plot it.

1. Find the stationary points and classify them.
   f'(x) = 3x^2 - 6x - 9 = 3(x - 3)(x + 1), so f'(x) = 0 at x = -1 and x = 3.
   f''(x) = 6x - 6. f''(-1) = -12 < 0, so a local maximum at (-1, 10). f''(3) = 12 > 0, so a local minimum at (3, -22).
   f''(x) = 0 at x = 1, giving the point of inflection (1, -6).
2. Evaluate the integral of f from 0 to 2.
   An antiderivative is F(x) = x^4/4 - x^3 - 9x^2/2 + 5x. F(2) = 4 - 8 - 18 + 10 = -12 and F(0) = 0, so the integral is -12.

Plot f(x) and f'(x) for x from -3 to 5, marking the maximum, the minimum, and the inflection point. Show each part's working as its own derivation. This is an example.`,
	},
];
