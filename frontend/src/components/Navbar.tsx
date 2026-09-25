import { Button } from "@heroui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signOut, useSession } from "../lib/auth-client";
import { ThemeToggle } from "./ThemeToggle";
import { UserAvatar } from "./UserAvatar";

export function Navbar() {
	const { data: session, isPending } = useSession();
	const user = session?.user;
	const navigate = useNavigate();

	async function handleSignOut() {
		await signOut();
		navigate("/");
	}

	return (
		<header className="border-b border-divider bg-background">
			<nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
				<RouterLink to="/" aria-label="Klee home">
					<img src="/kleelogo.svg" alt="Klee" className="size-10" />
				</RouterLink>

				<div className="flex items-center gap-2">
					{user && <RouterLink to="/" className="text-sm text-black/60 dark:text-white/60">Artefacts</RouterLink>}
					{isPending ? (
						<div
							className="h-8 w-36 animate-pulse rounded bg-black/5 dark:bg-white/10"
							aria-label="Loading account"
						/>
					) : user ? (
						<>
							<Button variant="ghost" className="gap-2" onPress={() => navigate("/profile")}>
								<UserAvatar image={user.image} name={user.name || user.email} size="sm" />
								{user.name || user.email}
							</Button>
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
