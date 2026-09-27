import {
	Card,
	Chip,
	Label,
	Paragraph,
	Separator,
	Skeleton,
	Slider,
} from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { ArtefactDocument } from "../../artefacts/model";
import { UserAvatar } from "../../components/UserAvatar";

type VersionSource = "generated" | "edit" | "revision" | "github";
type Version = {
	version: number;
	source: VersionSource;
	createdAt: string;
	author: { id: string; name: string; image: string | null } | null;
	changes: { label: string; before: string | null; after: string | null }[];
};

const sources: Record<
	VersionSource,
	{ label: string; color: "default" | "accent" | "success" }
> = {
	generated: { label: "Generated", color: "accent" },
	edit: { label: "Edited", color: "success" },
	revision: { label: "AI revision", color: "accent" },
	github: { label: "GitHub refresh", color: "default" },
};

const dateFormat: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	hour: "numeric",
	minute: "2-digit",
};

/**
 * Steps through an artefact's versions with a slider. Reports the selected
 * version's document through `onView`, or undefined for the latest version.
 */
export function VersionHistory({
	artefactId,
	latestVersion,
	onView,
}: {
	artefactId: string;
	latestVersion: number;
	onView: (content: ArtefactDocument | undefined) => void;
}) {
	const [versions, setVersions] = useState<Version[]>();
	const [selected, setSelected] = useState(latestVersion);
	const [error, setError] = useState("");
	const documents = useRef(new Map<number, ArtefactDocument>());

	useEffect(() => {
		fetch(`/api/artefacts/${artefactId}/versions`, {
			credentials: "include",
		})
			.then((response) =>
				response.ok ? response.json() : Promise.reject(),
			)
			.then((result: Version[]) => {
				setVersions(result);
				setSelected(result.length);
			})
			.catch(() => setError("Could not load version history."));
	}, [artefactId, latestVersion]);

	async function select(version: number) {
		setSelected(version);
		if (!versions || version === versions.length) return onView(undefined);
		const cached = documents.current.get(version);
		if (cached) return onView(cached);
		const response = await fetch(
			`/api/artefacts/${artefactId}/versions/${version}`,
			{
				credentials: "include",
			},
		);
		if (!response.ok) return setError("Could not load that version.");
		const { content } = (await response.json()) as {
			content: ArtefactDocument;
		};
		documents.current.set(version, content);
		onView(content);
	}

	if (error)
		return (
			<Paragraph size="sm" className="text-danger">
				{error}
			</Paragraph>
		);
	if (!versions)
		return (
			<div
				role="status"
				aria-label="Loading history"
				className="space-y-3"
			>
				<Skeleton animationType="pulse" className="h-4 w-1/3 rounded" />
				<Skeleton
					animationType="pulse"
					className="h-2 w-full rounded-full"
				/>
			</div>
		);
	const current = versions[selected - 1];
	const source = sources[current.source];

	return (
		<div className="space-y-4">
			{versions.length > 1 && (
				<Slider
					aria-label="Version"
					minValue={1}
					maxValue={versions.length}
					step={1}
					value={selected}
					onChange={(value) => void select(value as number)}
				>
					<Label>Version history</Label>
					<Slider.Output>
						{() => `Version ${selected} of ${versions.length}`}
					</Slider.Output>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb />
					</Slider.Track>
				</Slider>
			)}
			<div className="flex flex-wrap items-center gap-3">
				<UserAvatar
					image={current.author?.image}
					name={current.author?.name ?? "GitHub"}
					accountId={current.author?.id ?? "github"}
					size="sm"
				/>
				<Paragraph size="sm" weight="medium">
					{current.author?.name ?? "GitHub"}
				</Paragraph>
				<Chip size="sm" color={source.color}>
					{source.label}
				</Chip>
				<Paragraph size="xs" color="muted">
					{new Date(current.createdAt).toLocaleString(
						undefined,
						dateFormat,
					)}
				</Paragraph>
				{versions.length === 1 && (
					<Paragraph size="xs" color="muted">
						Only version so far
					</Paragraph>
				)}
			</div>
			{current.version === 1 ? (
				<Paragraph size="sm" color="muted">
					Created this artefact.
				</Paragraph>
			) : current.changes.length === 0 ? (
				<Paragraph size="sm" color="muted">
					Rebuilt the artefact.
				</Paragraph>
			) : (
				<Card className="gap-0 p-0">
					{current.changes.map((change, index) => (
						<Fragment key={index}>
							{index > 0 && <Separator />}
							<div className="px-4 py-3">
								<Paragraph size="xs" color="muted">
									{change.label}
								</Paragraph>
								<div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
									{change.before !== null && (
										<span className="text-muted line-through">
											{change.before}
										</span>
									)}
									{change.before !== null &&
										change.after !== null && (
											<ArrowRight
												size={14}
												className="shrink-0 text-muted"
											/>
										)}
									<span>
										{change.after ??
											"Removed or restructured"}
									</span>
								</div>
							</div>
						</Fragment>
					))}
				</Card>
			)}
		</div>
	);
}
