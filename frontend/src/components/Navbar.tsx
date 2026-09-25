import { Button } from "@heroui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
	const { data: session, isPending } = useSession();
	const user = session?.user;
	const navigate = useNavigate();

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}

	return (
		<header className="border-b border-black/10 dark:border-white/10">
			<nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
				<RouterLink to="/" className="font-semibold">
					Orcastrate
				</RouterLink>

				<div className="flex items-center gap-4">
					{isPending ? (
						<div
							className="h-8 w-36 animate-pulse rounded bg-black/5 dark:bg-white/10"
							aria-label="Loading account"
						/>
					) : user ? (
						<>
							<RouterLink
								to="/profile"
								className="text-sm text-black/60 dark:text-white/60"
							>
								{user.email}
							</RouterLink>
							<Button variant="ghost" onPress={handleSignOut}>
								Sign out
							</Button>
						</>
					) : (
						<>
							<RouterLink to="/login">Login</RouterLink>
							<RouterLink to="/register">Register</RouterLink>
						</>
					)}
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
