import { Chip, ListBox, Select } from "@heroui/react";
import { useEffect, useState } from "react";

type Project = { installationId: string; login: string };
const noProject = "none";

/**
 * Lets the owner move an artefact into a GitHub org (project) so its members
 * can view and edit it. Other viewers just see which project it belongs to.
 */
export function ProjectSelect({
	artefactId,
	installationId,
	project,
	isOwner,
	onChange,
	onError,
}: {
	artefactId: string;
	installationId: string | null;
	project: string | null;
	isOwner: boolean;
	onChange: (update: { installationId: string | null; project: string | null }) => void;
	onError: (message: string) => void;
}) {
	const [projects, setProjects] = useState<Project[]>([]);

	useEffect(() => {
		if (!isOwner) return;
		fetch("/api/projects", { credentials: "include" })
			.then((response) => (response.ok ? response.json() : []))
			.then(setProjects)
			.catch(() => setProjects([]));
	}, [isOwner]);

	if (!isOwner || (projects.length === 0 && !installationId))
		return project ? <Chip size="sm">{project}</Chip> : null;

	async function choose(key: string) {
		const next = key === noProject ? null : key;
		if (next === installationId) return;
		const response = await fetch(`/api/artefacts/${artefactId}/project`, {
			method: "PATCH",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ installationId: next }),
		});
		if (!response.ok) return onError("Could not change the project.");
		onChange(await response.json());
	}

	return (
		<Select
			aria-label="Project"
			className="w-44"
			value={installationId ?? noProject}
			onChange={(key) => void choose(String(key))}
		>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					<ListBox.Item id={noProject} textValue="Only me">
						Only me
					</ListBox.Item>
					{projects.map((option) => (
						<ListBox.Item
							key={option.installationId}
							id={option.installationId}
							textValue={option.login}
						>
							{option.login}
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
