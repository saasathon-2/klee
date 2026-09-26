import { Tag, TagGroup } from "@heroui/react";
import { describeLink } from "../lib/links";

/** Removable chips for the links attached to a prompt. */
export function LinkChips({
	links,
	onRemove,
}: {
	links: string[];
	onRemove: (url: string) => void;
}) {
	if (links.length === 0) return null;
	return (
		<TagGroup
			aria-label="Attached links"
			className="px-1 pb-2"
			onRemove={(keys) => keys.forEach((key) => onRemove(String(key)))}
		>
			<TagGroup.List className="flex flex-wrap gap-1.5">
				{links.map((link) => {
					const { label, Icon } = describeLink(link);
					return (
						<Tag key={link} id={link} textValue={label} className="max-w-72">
							<Icon aria-hidden className="size-3.5 shrink-0" />
							<span className="truncate" title={link}>
								{label}
							</span>
						</Tag>
					);
				})}
			</TagGroup.List>
		</TagGroup>
	);
}
