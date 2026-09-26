import type { WorkStatus } from "../../model";

/** Label, chip colour and bar fill for each shared work state. */
export const workStatuses = {
	done: { label: "Done", color: "success", fill: "bg-success" },
	active: { label: "In progress", color: "accent", fill: "bg-accent-text" },
	blocked: { label: "Blocked", color: "danger", fill: "bg-danger" },
	planned: { label: "Not started", color: "default", fill: "bg-muted/30" },
} as const satisfies Record<
	WorkStatus,
	{ label: string; color: "success" | "accent" | "danger" | "default"; fill: string }
>;

export const workStatus = (status: string) =>
	workStatuses[status as WorkStatus] ?? workStatuses.planned;
