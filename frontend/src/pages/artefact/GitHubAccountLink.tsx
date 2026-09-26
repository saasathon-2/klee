import { Button, Chip, Paragraph } from "@heroui/react";
import { useEffect, useState } from "react";
import { authClient, linkGitHub } from "../../lib/auth-client";

/** Links a GitHub login so org-shared artefacts can be accessed. */
export function GitHubAccountLink() {
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
		const { error: linkError } = await linkGitHub("/?panel=integrations");
		if (linkError) setError(linkError.message ?? "Could not link GitHub.");
	}

	if (isLinked === undefined) return null;
	return (
		<div className="mt-3">
			{isLinked ? (
				<Chip size="sm" color="success">GitHub account linked</Chip>
			) : (
				<Button variant="secondary" onPress={() => void link()}>
					Link GitHub account
				</Button>
			)}
			<Paragraph size="xs" color="muted" className="mt-2">
				Link your account to access artefacts shared with your GitHub organisations.
			</Paragraph>
			{error && <Paragraph size="xs" className="mt-1 text-danger">{error}</Paragraph>}
		</div>
	);
}
