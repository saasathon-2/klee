import { Card } from "@heroui/react";
import { Navigate } from "react-router-dom";
import { UserAvatar } from "../components/UserAvatar";
import { useSession } from "../lib/auth-client";

export function Profile() {
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<main className="mx-auto max-w-sm px-6 py-16">
				<div
					className="h-8 w-48 animate-pulse rounded bg-black/5 dark:bg-white/10"
					aria-label="Loading profile"
				/>
			</main>
		);
	}

	if (!session?.user) {
		return <Navigate to="/?auth=signin" replace />;
	}

	const { user } = session;

	return (
		<main className="mx-auto max-w-lg px-6 py-16">
			<Card>
				<Card.Header className="flex items-center gap-4">
					<UserAvatar image={user.image} name={user.name || user.email} size="lg" />
					<div>
						<Card.Title>{user.name || "Unnamed"}</Card.Title>
						<Card.Description>{user.email}</Card.Description>
					</div>
				</Card.Header>
				<Card.Content>
					<dl className="divide-y divide-divider text-sm">
						<div className="flex items-center justify-between py-3">
							<dt className="text-muted">Email verified</dt>
							<dd>{user.emailVerified ? "Yes" : "No"}</dd>
						</div>
						<div className="flex items-center justify-between py-3">
							<dt className="text-muted">Member since</dt>
							<dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
						</div>
					</dl>
				</Card.Content>
			</Card>
		</main>
	);
}
