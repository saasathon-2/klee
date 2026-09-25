import { useCallback, useEffect, useState } from "react";

export type Folder = { id: string; name: string };

const request = (path: string, init?: RequestInit) =>
	fetch(`/api${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...init,
	});

const byName = (a: Folder, b: Folder) =>
	a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

/** The signed-in user's artefact folders, with create, rename, and delete. */
export function useFolders(enabled: boolean, onError: (message: string) => void) {
	const [folders, setFolders] = useState<Folder[]>([]);

	useEffect(() => {
		if (!enabled) return;
		request("/folders")
			.then((response) => (response.ok ? response.json() : Promise.reject()))
			.then(setFolders)
			.catch(() => onError("Could not load folders."));
	}, [enabled, onError]);

	const create = useCallback(
		async (name: string) => {
			const response = await request("/folders", {
				method: "POST",
				body: JSON.stringify({ name }),
			});
			if (!response.ok) return onError("Could not create the folder.");
			const folder = (await response.json()) as Folder;
			setFolders((current) => [...current, folder].sort(byName));
			return folder;
		},
		[onError],
	);

	const rename = useCallback(
		async (id: string, name: string) => {
			const response = await request(`/folders/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ name }),
			});
			if (!response.ok) return onError("Could not rename the folder.");
			const folder = (await response.json()) as Folder;
			setFolders((current) =>
				current.map((item) => (item.id === id ? folder : item)).sort(byName),
			);
		},
		[onError],
	);

	const remove = useCallback(
		async (id: string) => {
			const response = await request(`/folders/${id}`, { method: "DELETE" });
			if (!response.ok) {
				onError("Could not delete the folder.");
				return false;
			}
			setFolders((current) => current.filter((item) => item.id !== id));
			return true;
		},
		[onError],
	);

	return { folders, create, rename, remove };
}
