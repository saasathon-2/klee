import { Button, Modal } from "@heroui/react";
import { Check, Copy, Globe2, Trash2, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Organisation } from "../Organisations";

type Permission = "view" | "comment" | "edit";
type Grant = { organisationId: string; name: string; permission: Permission };

const request = (path: string, init?: RequestInit) =>
	fetch(`/api${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });

export function ShareDialog({ artefactId, isShared, onSharingChange, onClose }: {
	artefactId: string;
	isShared: boolean;
	onSharingChange: (isShared: boolean) => void;
	onClose: () => void;
}) {
	const [organisations, setOrganisations] = useState<Organisation[]>([]);
	const [grants, setGrants] = useState<Grant[]>([]);
	const [organisationId, setOrganisationId] = useState("");
	const [permission, setPermission] = useState<Permission>("view");
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		Promise.all([request("/organisations"), request(`/artefacts/${artefactId}/organisations`)])
			.then(async ([organisationResponse, grantResponse]) => {
				if (!organisationResponse.ok || !grantResponse.ok) throw new Error();
				setOrganisations((await organisationResponse.json() as Organisation[]).filter((organisation) => organisation.role !== "member"));
				setGrants(await grantResponse.json() as Grant[]);
			})
			.catch(() => setError("Could not load sharing options."));
	}, [artefactId]);

	async function shareWithEveryone() {
		const response = await request(`/artefacts/${artefactId}/share`, { method: "POST" });
		if (!response.ok) return setError("Could not share this artefact.");
		onSharingChange(true);
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/artefacts/shared/${artefactId}`);
			setCopied(true);
		} catch {
			setError("The artefact is shared, but its link could not be copied.");
		}
	}

	async function makePrivate() {
		const response = await request(`/artefacts/${artefactId}/share`, { method: "DELETE" });
		if (!response.ok) return setError("Could not make this artefact private.");
		setGrants([]);
		setCopied(false);
		onSharingChange(false);
	}

	async function saveGrant() {
		if (!organisationId) return;
		const response = await request(`/artefacts/${artefactId}/organisations/${organisationId}`, {
			method: "PUT", body: JSON.stringify({ permission }),
		});
		if (!response.ok) return setError("Could not update organisation access.");
		const organisation = organisations.find((item) => item.id === organisationId);
		if (!organisation) return;
		setGrants((current) => [...current.filter((grant) => grant.organisationId !== organisationId), { organisationId, name: organisation.name, permission }]);
		setOrganisationId("");
	}

	async function removeGrant(organisationId: string) {
		const response = await request(`/artefacts/${artefactId}/organisations/${organisationId}`, { method: "DELETE" });
		if (!response.ok) return setError("Could not revoke organisation access.");
		setGrants((current) => current.filter((grant) => grant.organisationId !== organisationId));
	}

	const sharingStatus = isShared ? "Public" : grants.length ? "Shared with org" : "Private";

	return (
		<Modal>
			<Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()} variant="blur">
				<Modal.Container placement="center" scroll="inside" size="md">
					<Modal.Dialog aria-label="Share artefact" className="rounded-2xl p-0">
						<Modal.Header className="flex-row items-start gap-4 border-b border-border px-6 py-5"><div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><UsersRound size={20} /></div><div className="flex-1"><Modal.Heading>Share artefact</Modal.Heading><p className="mt-1 text-sm text-muted">Choose who can access this work.</p></div><Button aria-label="Close share dialog" variant="ghost" className="size-8 min-w-8 p-0" onPress={onClose}><X size={18} /></Button></Modal.Header>
						<Modal.Body className="m-0 space-y-5 p-6">
							<section className="flex items-center gap-3 rounded-xl border border-border p-4"><div className="min-w-0 flex-1"><p className="text-sm text-muted">Current sharing</p><p className="font-medium">{sharingStatus}</p></div>{sharingStatus !== "Private" && <Button size="sm" variant="ghost" className="text-danger" onPress={() => void makePrivate()}>Make private</Button>}</section>
							<section className="rounded-xl border border-border p-4"><div className="flex items-center gap-3"><Globe2 size={18} /><div className="min-w-0 flex-1"><p className="font-medium">Anyone with the link</p><p className="text-sm text-muted">Anyone can view; they cannot comment or edit.</p></div><Button size="sm" variant={isShared ? "secondary" : "primary"} onPress={() => void shareWithEveryone()}>{copied ? <><Check size={15} /> Link copied</> : isShared ? <><Copy size={15} /> Copy link</> : "Share to all"}</Button></div></section>
							<section className="rounded-xl border border-border p-4"><p className="font-medium">Organisation</p><p className="mt-1 text-sm text-muted">Choose the access level for one organisation.</p><div className="mt-3 flex flex-wrap gap-2"><select aria-label="Organisation" value={organisationId} onChange={(event) => setOrganisationId(event.target.value)} className="min-w-40 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"><option value="">Select an organisation</option>{organisations.map((organisation) => <option key={organisation.id} value={organisation.id}>{organisation.name}</option>)}</select><select aria-label="Permission" value={permission} onChange={(event) => setPermission(event.target.value as Permission)} className="rounded-md border border-border bg-surface px-3 py-2 text-sm"><option value="view">Can view</option><option value="comment">Can comment</option><option value="edit">Can edit</option></select><Button isDisabled={!organisationId} onPress={() => void saveGrant()}>Share</Button></div></section>
							{grants.length > 0 && <section><p className="mb-2 text-sm font-medium">Organisation access</p><div className="space-y-2">{grants.map((grant) => <div key={grant.organisationId} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"><span className="min-w-0 flex-1 truncate text-sm">{grant.name}</span><span className="text-xs capitalize text-muted">Can {grant.permission}</span><Button aria-label={`Remove ${grant.name}`} size="sm" variant="ghost" className="size-7 min-w-7 p-0 text-danger" onPress={() => void removeGrant(grant.organisationId)}><Trash2 size={14} /></Button></div>)}</div></section>}
							{error && <p role="alert" className="text-sm text-danger">{error}</p>}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
