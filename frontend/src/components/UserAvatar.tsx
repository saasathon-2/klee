import { Avatar } from "@heroui/react";

const avatarColours = ["#2a78d6", "#d95926", "#199e70", "#8b5cf6"];

function initials(name: string) {
	return (
		name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0])
			.join("")
			.toUpperCase() || "?"
	);
}

function colourFor(accountId: string) {
	return avatarColours[
		[...accountId].reduce(
			(total, character) => total + character.charCodeAt(0),
			0,
		) % avatarColours.length
	];
}

export function UserAvatar({
	image,
	name,
	accountId,
	size = "md",
}: {
	image?: string | null;
	name: string;
	accountId: string;
	size?: "sm" | "md" | "lg";
}) {
	return (
		<Avatar size={size}>
			{image && <Avatar.Image src={image} alt={name} />}
			<Avatar.Fallback
				className="font-semibold text-white"
				style={{ backgroundColor: colourFor(accountId) }}
			>
				{initials(name)}
			</Avatar.Fallback>
		</Avatar>
	);
}
