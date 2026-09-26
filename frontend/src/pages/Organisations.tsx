import { Button, Input, Modal } from "@heroui/react";
import { Building2, Plus, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";

type Role = "owner" | "admin" | "member";
type Member = { id: string; name: string | null; email: string; image: string | null; role: Role };
export type Organisation = { id: string; name: string; role: Role; members: Member[] };

const request = (path: string, init?: RequestInit) =>
	fetch(`/api${path}`, { credentials: "include", headers: { "Content-Type": "application/json" }, ...init });

export function OrganisationsModal({ onClose }: { onClose: () => void }) {
	const [organisations, setOrganisations] = useState<Organisation[]>();
	const [name, setName] = useState("");
	const [emails, setEmails] = useState<Record<string, string>>({});
	const [error, setError] = useState("");

	useEffect(() => {
		request("/organisations").then((response) => response.ok ? response.json() : Promise.reject())
			.then(setOrganisations).catch(() => setError("Could not load organisations."));
	}, []);

	async function create() {
		const response = await request("/organisations", { method: "POST", body: JSON.stringify({ name }) });
		if (!response.ok) return setError("Could not create the organisation.");
		const organisation = (await response.json()) as Organisation;
		setOrganisations((current) => [...(current ?? []), organisation]);
		setName("");
	}

	async function addMember(organisation: Organisation) {
		const email = emails[organisation.id]?.trim();
		if (!email) return;
		const response = await request(`/organisations/${organisation.id}/members`, {
			method: "POST", body: JSON.stringify({ email, role: "member" }),
		});
		if (!response.ok) return setError("Could not add that user. They must already have a Klee account.");
		const member = (await response.json()) as Member;
		setOrganisations((current) => current?.map((item) => item.id === organisation.id
			? { ...item, members: [...item.members.filter((existing) => existing.id !== member.id), member] }
			: item));
		setEmails((current) => ({ ...current, [organisation.id]: "" }));
	}

	async function changeRole(organisation: Organisation, member: Member, role: Role) {
		const response = await request(`/organisations/${organisation.id}/members/${member.id}`, {
			method: "PATCH", body: JSON.stringify({ role }),
		});
		if (!response.ok) return setError("Could not update that role.");
		setOrganisations((current) => current?.map((item) => item.id === organisation.id
			? { ...item, members: item.members.map((existing) => existing.id === member.id ? { ...existing, role } : existing) }
			: item));
	}

	return (
		<Modal>
			<Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()} variant="blur">
				<Modal.Container placement="center" scroll="inside" size="lg">
					<Modal.Dialog aria-label="Organisations" className="max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl p-0">
						<Modal.Header className="flex-row items-start gap-4 border-b border-border px-6 py-5">
							<div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Building2 size={20} /></div>
							<div className="min-w-0 flex-1"><Modal.Heading>Organisations</Modal.Heading><p className="mt-1 text-sm text-muted">Manage the people and roles you share work with.</p></div>
							<Button aria-label="Close organisations" variant="ghost" className="size-8 min-w-8 p-0" onPress={onClose}><X size={18} /></Button>
						</Modal.Header>
						<Modal.Body className="m-0 space-y-5 p-6">
							<div className="flex gap-2"><Input aria-label="Organisation name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New organisation" /><Button isDisabled={!name.trim()} onPress={create}><Plus size={16} /> Create</Button></div>
							{error && <p role="alert" className="text-sm text-danger">{error}</p>}
							{organisations?.map((organisation) => (
								<section key={organisation.id} className="rounded-xl border border-border p-4">
									<div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{organisation.name}</h2><span className="text-xs capitalize text-muted">{organisation.role}</span></div>
									<div className="space-y-2">
										{organisation.members.map((member) => <div key={member.id} className="flex items-center gap-3 text-sm"><span className="min-w-0 flex-1 truncate">{member.name || member.email}</span>{organisation.role === "owner" ? <select aria-label={`${member.name || member.email} role`} value={member.role} onChange={(event) => void changeRole(organisation, member, event.target.value as Role)} className="rounded-md border border-border bg-surface px-2 py-1 text-xs capitalize"><option value="owner">Owner</option><option value="admin">Admin</option><option value="member">Member</option></select> : <span className="text-xs capitalize text-muted">{member.role}</span>}</div>)}
									</div>
									{organisation.role !== "member" && <div className="mt-4 flex gap-2"><Input aria-label={`Add a member to ${organisation.name}`} value={emails[organisation.id] ?? ""} onChange={(event) => setEmails((current) => ({ ...current, [organisation.id]: event.target.value }))} placeholder="teammate@example.com" /><Button size="sm" isDisabled={!emails[organisation.id]?.trim()} onPress={() => void addMember(organisation)}><UserPlus size={15} /> Add</Button></div>}
								</section>
							))}
							{organisations?.length === 0 && <p className="py-8 text-center text-sm text-muted">Create an organisation to share artefacts with your team.</p>}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
