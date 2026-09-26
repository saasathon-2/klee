import { Button, Chip, Paragraph } from "@heroui/react";
import { useEffect, useState } from "react";
import { authClient, linkGitHub } from "../../lib/auth-client";

/**
 * Links a GitHub login to the current user so artefacts in their GitHub orgs
 * become visible and editable. Separate from installing the GitHub App.
 */
export function GitHubAccountLink({
	returnTo = "/profile",
}: {
	/** Where GitHub sends the user back to after linking. */
	returnTo?: string;
} = {}) {
	const [isLinked, setIsLinked] = useState<boolean>();
	const [error, setError] = useState("");

	useEffect(() => {
		authClient
			.listAccounts()
			.then(({ data }) =>
				setIsLinked(Boolean(data?.some((account) => account.providerId === "github"))),
			)
			.catch(() => setIsLinked(false));
	}, []);

	async function link() {
		setError("");
		const { error: linkError } = await linkGitHub(returnTo);
		if (linkError) setError(linkError.message ?? "Could not link GitHub.");
	}

	if (isLinked === undefined) return null;
	return (
		<div className="mt-3">
			{isLinked ? (
				<Chip size="sm" color="success">
					GitHub account linked
				</Chip>
			) : (
				<Button variant="secondary" onPress={() => void link()}>
					Link GitHub account
				</Button>
			)}
			<Paragraph size="xs" color="muted" className="mt-2">
				Members of your GitHub orgs can view and edit artefacts in those projects.
			</Paragraph>
			{error && (
				<Paragraph size="xs" className="mt-1 text-danger">
					{error}
				</Paragraph>
			)}
		</div>
	);
}
