import { Avatar } from "@heroui/react";
import { UserRound } from "lucide-react";

const HEROUI_DEFAULT_AVATAR =
	"https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg";

export function UserAvatar({
	image,
	name,
	size = "md",
}: {
	image?: string | null;
	name: string;
	size?: "sm" | "md" | "lg";
}) {
	return (
		<Avatar size={size}>
			<Avatar.Image src={image || HEROUI_DEFAULT_AVATAR} alt={name} />
			<Avatar.Fallback>
				<UserRound size={size === "lg" ? 20 : 16} />
			</Avatar.Fallback>
		</Avatar>
	);
}
