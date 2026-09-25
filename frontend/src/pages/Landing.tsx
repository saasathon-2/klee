import { Button, Card, Chip } from "@heroui/react";
import { useNavigate } from "react-router-dom";

export function Landing() {
	const navigate = useNavigate();

	return (
		<main className="mx-auto max-w-6xl px-6 py-20">
			<section className="mx-auto max-w-3xl text-center">
				<Chip className="mb-6">Built with HeroUI</Chip>
				<h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
					Make the next move feel obvious.
				</h1>
				<p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
					A focused home for the work, people, and decisions that matter
					most.
				</p>
				<div className="mt-8 flex justify-center gap-3">
					<Button onPress={() => navigate("/register")}>Get started</Button>
					<Button variant="ghost" onPress={() => navigate("/login")}>
						Sign in
					</Button>
				</div>
			</section>

			<section className="mt-20 grid gap-5 md:grid-cols-3">
				{[
					["One clear place", "Keep the context around your work together."],
					["Progress, visible", "See what needs attention without hunting for it."],
					["Ready to share", "Invite the right people when the moment is right."],
				].map(([title, description]) => (
					<Card key={title} className="min-h-44">
						<Card.Header>
							<Card.Title>{title}</Card.Title>
							<Card.Description>{description}</Card.Description>
						</Card.Header>
						<Card.Content>
							<div className="h-2 w-2/3 rounded-full bg-accent" />
						</Card.Content>
					</Card>
				))}
			</section>

			<section className="mt-20">
				<h2 className="text-2xl font-semibold">Explore the component samples</h2>
				<div className="mt-5 flex flex-wrap gap-3">
					<Button variant="ghost" onPress={() => navigate("/examples/forms")}>Forms</Button>
					<Button variant="ghost" onPress={() => navigate("/examples/social")}>Social cards</Button>
					<Button variant="ghost" onPress={() => navigate("/examples/settings")}>Settings</Button>
				</div>
			</section>
		</main>
	);
}
