/**
 * Live CI status for GitHub check runs linked from an artefact. Only links the
 * artefact already contains are looked up, and only through GitHub App
 * installations the artefact's owner connected, so a viewer can't use this to
 * probe arbitrary repositories.
 */

export type LiveStatus = {
	status: "passed" | "failed" | "pending";
	detail: string;
	checkedAt: string;
};

type CheckRunLink = { url: string; owner: string; repo: string; checkRunId: string };

/** Check run pages and Actions job pages; an Actions job id is its check run id. */
const checkRunPattern =
	/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/(?:runs\/(\d+)|actions\/runs\/\d+\/job\/(\d+))(?:[/?#].*)?$/;

const maxLinks = 30;

export function checkRunLinks(content: unknown): CheckRunLink[] {
	const links = new Map<string, CheckRunLink>();
	const visit = (value: unknown) => {
		if (links.size >= maxLinks) return;
		if (Array.isArray(value)) return value.forEach(visit);
		if (!value || typeof value !== "object") return;
		for (const [key, child] of Object.entries(value)) {
			if (key === "url" && typeof child === "string") {
				const match = checkRunPattern.exec(child);
				if (match && !links.has(child))
					links.set(child, {
						url: child,
						owner: match[1],
						repo: match[2],
						checkRunId: match[3] ?? match[4],
					});
			} else visit(child);
		}
	};
	visit(content);
	return [...links.values()];
}

export function toLiveStatus(
	run: { status?: string; conclusion?: string | null; completed_at?: string | null },
	now: Date,
): LiveStatus {
	const checkedAt = now.toISOString();
	if (run.status !== "completed")
		return { status: "pending", detail: run.status === "in_progress" ? "Running" : "Queued", checkedAt };
	const conclusion = run.conclusion ?? "";
	if (["success", "neutral", "skipped"].includes(conclusion))
		return { status: "passed", detail: conclusion === "success" ? "Passed" : `Completed (${conclusion})`, checkedAt };
	return { status: "failed", detail: conclusion ? `Completed (${conclusion.replace(/_/g, " ")})` : "Failed", checkedAt };
}

type Dependencies = {
	installations: { installationId: string; accountLogin: string }[];
	request: (installationId: string, path: string) => Promise<Response>;
	now?: () => Date;
};

const cacheMs = 20_000;
const cache = new Map<string, { at: number; value: LiveStatus }>();

export async function liveCheckStatuses(content: unknown, deps: Dependencies) {
	const now = deps.now ?? (() => new Date());
	const results: Record<string, LiveStatus> = {};
	await Promise.all(
		checkRunLinks(content).map(async (link) => {
			const cached = cache.get(link.url);
			if (cached && now().getTime() - cached.at < cacheMs) {
				results[link.url] = cached.value;
				return;
			}
			const installation = deps.installations.find(
				(item) => item.accountLogin.toLowerCase() === link.owner.toLowerCase(),
			);
			if (!installation) return;
			try {
				const response = await deps.request(
					installation.installationId,
					`/repos/${link.owner}/${link.repo}/check-runs/${link.checkRunId}`,
				);
				const value = toLiveStatus(await response.json(), now());
				cache.set(link.url, { at: now().getTime(), value });
				results[link.url] = value;
			} catch {
				// A deleted run or revoked installation leaves the saved status in place.
			}
		}),
	);
	return results;
}
