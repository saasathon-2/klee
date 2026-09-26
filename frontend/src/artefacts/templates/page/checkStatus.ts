import { CircleCheck, CircleDashed, CircleX } from "lucide-react";

/** Chip colour, label and icon for passed, failed and pending checks. */
export const checkStatuses = {
	passed: { color: "success", label: "Passed", icon: CircleCheck, tone: "text-success" },
	failed: { color: "danger", label: "Failed", icon: CircleX, tone: "text-danger" },
	pending: { color: "warning", label: "Pending", icon: CircleDashed, tone: "text-warning" },
} as const;
