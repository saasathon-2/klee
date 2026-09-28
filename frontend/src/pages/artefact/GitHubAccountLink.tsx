import { Button, Chip, Paragraph } from "@heroui/react";
import { useEffect, useState } from "react";
import { linkGitHub } from "../../lib/auth-client";

/** Enables organisation access after the GitHub App is connected. */
export function GitHubAccountLink({
	returnTo = "/integrations",
}: {
	/** Where GitHub sends the user back to after linking. */
	returnTo?: string;
} = {}) {
	const [isLinked, setIsLinked] = useState<boolean>();
	const [error, setError] = useState("");

	useEffect(() => {
		fetch("/api/integrations/github/account", { credentials: "include" })
			.then((response) =>
				response.ok
					? (response.json() as Promise<{ connected: boolean }>)
					: { connected: false },
			)
			.then((data) => setIsLinked(data.connected))
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
					Organisation sharing enabled
				</Chip>
			) : (
				<Button variant="secondary" onPress={() => void link()}>
					Enable organisation sharing
				</Button>
			)}
			<Paragraph size="xs" color="muted" className="mt-2">
				Optional: link your GitHub identity so Klee can verify your
				organisation membership for team-shared artefacts.
			</Paragraph>
			{error && (
				<Paragraph size="xs" className="mt-1 text-danger">
					{error}
				</Paragraph>
			)}
		</div>
	);
}
