import type { ArtefactDocument } from "../../artefacts/model";

/** Example artefacts rendered on the landing page, generated from the developer template prompts. */
export const landingSamples: Record<"create" | "review" | "share" | "integrate", ArtefactDocument> = {
	"create": {
		"version": 1,
		"root": {
			"id": "root",
			"template": "artefact-page",
			"data": {},
			"children": [
				{
					"id": "category",
					"template": "developer-page",
					"data": {
						"eyebrow": "",
						"title": "PR #482 - Linking authentication API to backend",
						"summary": "Session validation moves to the gateway and keys now expire. Ready to merge once lint passes.",
						"tags": [
							"Pull request",
							"Backend"
						]
					},
					"children": [
						{
							"id": "m",
							"template": "metric-row",
							"data": {
								"items": [
									{
										"label": "Reviews",
										"value": "3 approvals",
										"detail": "One comment outstanding"
									},
									{
										"label": "Risk",
										"value": "Low",
										"detail": "Session key handling flagged"
									},
									{
										"label": "Scope",
										"value": "12 files",
										"detail": "Mostly backend routing"
									}
								]
							}
						},
						{
							"id": "a",
							"template": "architecture-flow",
							"data": {
								"title": "How requests flow",
								"description": "Auth now routes through the gateway before reaching any service.",
								"nodes": [
									{
										"label": "Client",
										"detail": "Sends credentials"
									},
									{
										"label": "Gateway",
										"detail": "Validates sessions"
									},
									{
										"label": "Backend",
										"detail": "Serves the request"
									}
								]
							}
						},
						{
							"id": "t",
							"template": "task-list",
							"data": {
								"title": "Next up",
								"description": "",
								"tasks": [
									{
										"id": "1",
										"key": "KL-1",
										"title": "Fix the two lint errors in session.ts",
										"detail": "Unused import and missing return type.",
										"meta": "5 min",
										"status": "Open"
									},
									{
										"id": "2",
										"key": "KL-2",
										"title": "Merge this PR",
										"detail": "After the preview deploy finishes.",
										"meta": "2 min",
										"status": "Blocked"
									}
								]
							}
						}
					]
				}
			]
		}
	},
	"review": {
		"version": 1,
		"root": {
			"id": "root",
			"template": "artefact-page",
			"data": {
				"title": "Session key storage"
			},
			"children": [
				{
					"id": "category",
					"template": "developer-page",
					"data": {
						"eyebrow": "Code change",
						"title": "Session key storage",
						"summary": "The change creates longer session keys and stores session identity and expiry in keyStore.",
						"tags": [
							"authentication",
							"sessions",
							"code diff"
						]
					},
					"children": [
						{
							"id": "block-1",
							"template": "code-diff",
							"data": {
								"title": "Session creation change",
								"description": "The session key grows from 16 to 32 random bytes. Instead of storing the user ID in the in-memory sessions map, the function stores the user ID and an expiration timestamp in keyStore. It still logs session creation and returns the key.",
								"file": "src/auth/session.ts",
								"hunks": [
									{
										"header": "@@ -12,10 +12,12 @@ export async function createSession(user: User) {",
										"oldStart": 12,
										"newStart": 12,
										"lines": [
											{
												"kind": "context",
												"content": "const now = Date.now();"
											},
											{
												"kind": "remove",
												"content": "const key = crypto.randomBytes(16).toString(\"hex\");"
											},
											{
												"kind": "remove",
												"content": "sessions.set(key, user.id);"
											},
											{
												"kind": "add",
												"content": "const key = crypto.randomBytes(32).toString(\"hex\");"
											},
											{
												"kind": "add",
												"content": "await keyStore.put(key, {"
											},
											{
												"kind": "add",
												"content": "  userId: user.id,"
											},
											{
												"kind": "add",
												"content": "  expiresAt: now + SESSION_TTL_MS,"
											},
											{
												"kind": "add",
												"content": "});"
											},
											{
												"kind": "context",
												"content": "audit.log(\"session.created\", { userId: user.id });"
											},
											{
												"kind": "context",
												"content": "return key;"
											}
										]
									}
								]
							}
						}
					]
				}
			]
		}
	},
	"share": {
		"version": 1,
		"root": {
			"id": "root",
			"template": "artefact-page",
			"data": {
				"title": "Linking authentication API to backend"
			},
			"children": [
				{
					"id": "category",
					"template": "developer-page",
					"data": {
						"eyebrow": "Pull request review",
						"title": "Linking authentication API to backend",
						"summary": "Three reviewers approved the PR, while feedback identifies follow-up work on session key rotation and UI state consistency.",
						"tags": [
							"PR #482",
							"review feedback",
							"authentication"
						]
					},
					"children": [
						{
							"id": "block-1",
							"template": "review-comments",
							"data": {
								"title": "PR #482 reviewer feedback",
								"summary": "Overall consensus is positive, with three approvals. Reviewers flag session key rotation as a follow-up needed before merge, and note two UI consistency issues: rename the registered state to verified and update its profile badge colour.",
								"comments": [
									{
										"author": "jane_doe",
										"verdict": "approved",
										"body": "Looks good overall, but session keys should be rotated when a user logs in again."
									},
									{
										"author": "sam_lee",
										"verdict": "approved",
										"body": "Nice clean-up of the routing layer. Nit: rename \"registered\" state to \"verified\" so it matches the UI."
									},
									{
										"author": "priya_k",
										"verdict": "commented",
										"body": "The registered state still renders the old badge colour on the profile page."
									},
									{
										"author": "tom_w",
										"verdict": "approved",
										"body": "Happy to merge once the key rotation follow-up is ticketed."
									}
								]
							}
						}
					]
				}
			]
		}
	},
	"integrate": {
		"version": 1,
		"root": {
			"id": "root",
			"template": "artefact-page",
			"data": {
				"title": "PR #482 CI results"
			},
			"children": [
				{
					"id": "category",
					"template": "developer-page",
					"data": {
						"eyebrow": "CI summary",
						"title": "PR #482 CI results",
						"summary": "Most checks passed, but lint failed and the preview deploy is pending. Fix lint and wait for the deploy before merging.",
						"tags": [
							"PR #482",
							"CI",
							"merge readiness"
						]
					},
					"children": [
						{
							"id": "block-1",
							"template": "check-list",
							"data": {
								"title": "PR #482 CI checks",
								"checks": [
									{
										"name": "Unit tests",
										"status": "passed",
										"detail": "412 tests completed in 1m 48s"
									},
									{
										"name": "Integration tests",
										"status": "passed",
										"detail": "36 tests passed against the staging database"
									},
									{
										"name": "Lint",
										"status": "failed",
										"detail": "2 errors in src/auth/session.ts: unused import and missing return type"
									},
									{
										"name": "Type check",
										"status": "passed",
										"detail": "Type check passed"
									},
									{
										"name": "Security scan",
										"status": "passed",
										"detail": "No new vulnerabilities found"
									},
									{
										"name": "Preview deploy",
										"status": "pending",
										"detail": "Queued behind 2 other builds"
									}
								]
							}
						},
						{
							"id": "block-2",
							"template": "prose",
							"data": {
								"title": "Merge readiness",
								"body": "PR #482 is not ready to merge: lint has two errors to fix, and the preview deploy is still pending. The other reported checks passed."
							}
						}
					]
				}
			]
		}
	}
};
