import type { QueryResult } from "pg";
import { pool, transaction } from "./db.ts";

/** How long a user's GitHub org list is trusted before it is refreshed. */
export const orgRefreshMs = 15 * 60 * 1000;

/**
 * SQL condition: the user in `userParam` owns the artefact, or belongs to the
 * GitHub account (org or personal) that the artefact's installation is for.
 * Keep in step with `canAccessArtefact`.
 */
export function accessibleArtefactSql(userParam: string, alias = "artefact") {
	return `(${alias}.owner_id = ${userParam} or exists (
		select 1 from github_installation access_installation
		join github_user_org access_org on lower(access_org.org_login) = lower(access_installation.account_login)
		where access_installation.installation_id = ${alias}.github_installation_id
			and access_org.user_id = ${userParam}
	))`;
}

/** The access rule `accessibleArtefactSql` applies, for code that has the rows in hand. */
export function canAccessArtefact(
	artefact: { ownerId: string; projectLogin: string | null },
	userId: string,
	userOrgs: string[],
) {
	if (artefact.ownerId === userId) return true;
	if (!artefact.projectLogin) return false;
	const project = artefact.projectLogin.toLowerCase();
	return userOrgs.some((org) => org.toLowerCase() === project);
}

type Query = (text: string, values?: unknown[]) => Promise<Pick<QueryResult, "rows">>;
type Dependencies = {
	query: Query;
	transaction: <T>(work: (client: { query: Query }) => Promise<T>) => Promise<T>;
	fetch: typeof fetch;
	now: () => Date;
};

const defaults: Dependencies = {
	query: (text, values) => pool.query(text, values),
	transaction,
	fetch: (...args) => fetch(...args),
	now: () => new Date(),
};

async function githubUser(token: string, path: string, doFetch: typeof fetch) {
	return doFetch(`https://api.github.com${path}`, {
		headers: {
			Accept: "application/vnd.github+json",
			Authorization: `Bearer ${token}`,
			"User-Agent": "Klee",
			"X-GitHub-Api-Version": "2022-11-28",
		},
	});
}

/**
 * Refreshes the GitHub logins (own login plus orgs) stored for a user when the
 * cached list is stale. A missing or revoked GitHub token clears the list, so
 * org access fails closed; a temporary GitHub error keeps the cached list.
 */
export async function refreshGitHubOrgs(userId: string, deps: Dependencies = defaults) {
	const account = await deps.query(
		`select "accessToken" as "accessToken" from account where "userId" = $1 and "providerId" = 'github' and "accessToken" is not null limit 1`,
		[userId],
	);
	const token: string | undefined = account.rows[0]?.accessToken;
	const clear = () => deps.query("delete from github_user_org where user_id = $1", [userId]);
	if (!token) return clear();

	const cached = await deps.query(
		'select min(refreshed_at) as "refreshedAt" from github_user_org where user_id = $1',
		[userId],
	);
	const refreshedAt: Date | null = cached.rows[0]?.refreshedAt ?? null;
	if (refreshedAt && deps.now().getTime() - new Date(refreshedAt).getTime() < orgRefreshMs) return;

	const profile = await githubUser(token, "/user", deps.fetch);
	if (profile.status === 401) return clear();
	if (!profile.ok) return;
	const logins = [((await profile.json()) as { login: string }).login];
	for (let page = 1; ; page++) {
		const response = await githubUser(token, `/user/orgs?per_page=100&page=${page}`, deps.fetch);
		if (response.status === 401) return clear();
		if (!response.ok) return;
		const orgs = (await response.json()) as { login: string }[];
		logins.push(...orgs.map((org) => org.login));
		if (orgs.length < 100) break;
	}

	await deps.transaction(async (client) => {
		await client.query("delete from github_user_org where user_id = $1", [userId]);
		for (const login of new Set(logins))
			await client.query(
				"insert into github_user_org (user_id, org_login, refreshed_at) values ($1, $2, $3)",
				[userId, login, deps.now()],
			);
	});
}
