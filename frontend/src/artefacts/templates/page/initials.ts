/** Two-letter avatar fallback from a name or handle such as "@jane_doe". */
export function initials(name: string) {
	const parts = name.replace(/^@/, "").split(/[\s._-]+/).filter(Boolean);
	return (
		(parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")
	).toUpperCase();
}
