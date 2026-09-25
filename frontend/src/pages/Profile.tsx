import { Navigate } from "react-router-dom";
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
		return <Navigate to="/login" replace />;
	}

	const { user } = session;

	return (
		<main className="mx-auto max-w-sm px-6 py-16">
			<h1 className="mb-6 text-3xl font-semibold">Profile</h1>

			<div className="flex items-center gap-4">
				{user.image ? (
					<img
						src={user.image}
						alt={user.name ?? user.email}
						className="h-16 w-16 rounded-full object-cover"
					/>
				) : (
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/5 text-lg font-semibold dark:bg-white/10">
						{(user.name ?? user.email).charAt(0).toUpperCase()}
					</div>
				)}

				<div>
					<p className="font-semibold">{user.name || "Unnamed"}</p>
					<p className="text-sm text-black/60 dark:text-white/60">
						{user.email}
					</p>
				</div>
			</div>

			<dl className="mt-10 divide-y divide-black/10 text-sm dark:divide-white/10">
				<div className="flex items-center justify-between py-3">
					<dt className="text-black/60 dark:text-white/60">Email verified</dt>
					<dd>{user.emailVerified ? "Yes" : "No"}</dd>
				</div>
				<div className="flex items-center justify-between py-3">
					<dt className="text-black/60 dark:text-white/60">Member since</dt>
					<dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
				</div>
			</dl>
		</main>
	);
}
