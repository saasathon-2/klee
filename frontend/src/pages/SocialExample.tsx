import { Avatar, AvatarGroup, Button, Card, Chip } from "@heroui/react";
import { useDocumentTitle } from "../useDocumentTitle";

const communities = [
	["Indie Hackers", "148 members", "IH", "orange"],
	["AI Builders", "362 members", "AI", "blue"],
];

const avatarUrl = (color: string) =>
	`https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/${color}.jpg`;

export function SocialExample() {
	useDocumentTitle("Social cards - Klee");
	return (
		<main className="mx-auto max-w-5xl px-6 py-16">
			<h1 className="mt-2 text-4xl font-semibold">Social cards</h1>

			<Card className="mt-10">
				<Card.Header className="flex-row items-center gap-4">
					<Avatar size="lg">
						<Avatar.Image alt="HeroUI" src={avatarUrl("purple")} />
						<Avatar.Fallback>HU</Avatar.Fallback>
					</Avatar>
					<div>
						<Card.Title>HeroUI community</Card.Title>
						<Card.Description>
							@hero_ui · Building thoughtful interfaces
						</Card.Description>
					</div>
				</Card.Header>
				<Card.Content>
					<p>Building the future of UI for web and mobile. 🚀</p>
					<div className="mt-6 flex items-center justify-between">
						<AvatarGroup
							max={5}
							overlap="ring"
							aria-label="Community members"
						>
							{[
								"blue",
								"green",
								"purple",
								"orange",
								"red",
								"blue",
								"green",
							].map((color, index) => (
								<Avatar key={`${color}-${index}`}>
									<Avatar.Image
										alt="Community member"
										src={avatarUrl(color)}
									/>
									<Avatar.Fallback>
										{color[0]?.toUpperCase()}
									</Avatar.Fallback>
								</Avatar>
							))}
						</AvatarGroup>
						<Button variant="ghost">Follow</Button>
					</div>
				</Card.Content>
			</Card>

			<div className="mt-8 grid gap-5 sm:grid-cols-2">
				{communities.map(([name, members, initials, color]) => (
					<Card key={name} variant="secondary">
						<Card.Header>
							<Avatar size="lg">
								<Avatar.Image
									alt={name}
									src={avatarUrl(color)}
								/>
								<Avatar.Fallback>{initials}</Avatar.Fallback>
							</Avatar>
							<Card.Title className="mt-4">{name}</Card.Title>
							<Card.Description>{members}</Card.Description>
						</Card.Header>
						<Card.Footer className="justify-between">
							<Chip>Open group</Chip>
							<Button variant="ghost">View</Button>
						</Card.Footer>
					</Card>
				))}
			</div>
		</main>
	);
}
