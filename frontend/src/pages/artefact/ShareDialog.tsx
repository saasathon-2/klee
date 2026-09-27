import {
	Button,
	Form,
	Input,
	Label,
	ListBox,
	Modal,
	Paragraph,
	Select,
	Separator,
	Switch,
	TextField,
} from "@heroui/react";
import { Building2, Check, Globe2, Link2, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { UserAvatar } from "../../components/UserAvatar";
import type { Organisation } from "../Organisations";

type Permission = "view" | "comment" | "edit";
type Grant = { organisationId: string; name: string; permission: Permission };
type Person = {
	userId: string;
	name: string | null;
	email: string;
	image: string | null;
	permission: Permission;
};

const permissionLabels: Record<Permission, string> = {
	view: "Can view",
	comment: "Can comment",
	edit: "Can edit",
};

const request = (path: string, init?: RequestInit) =>
	fetch(`/api${path}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		...init,
	});

function PermissionSelect({
	value,
	onChange,
	label,
}: {
	value: Permission;
	onChange: (permission: Permission) => void;
	label: string;
}) {
	return (
		<Select
			aria-label={label}
			className="w-36 shrink-0"
			value={value}
			onChange={(key) => onChange(key as Permission)}
		>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					{(Object.keys(permissionLabels) as Permission[]).map(
						(permission) => (
							<ListBox.Item
								key={permission}
								id={permission}
								textValue={permissionLabels[permission]}
							>
								{permissionLabels[permission]}
							</ListBox.Item>
						),
					)}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}

export function ShareDialog({
	artefactId,
	isShared,
	onSharingChange,
	onClose,
}: {
	artefactId: string;
	isShared: boolean;
	onSharingChange: (isShared: boolean) => void;
	onClose: () => void;
}) {
	const [organisations, setOrganisations] = useState<Organisation[]>([]);
	const [grants, setGrants] = useState<Grant[]>([]);
	const [people, setPeople] = useState<Person[]>([]);
	const [email, setEmail] = useState("");
	const [invitePermission, setInvitePermission] =
		useState<Permission>("view");
	const [isInviting, setInviting] = useState(false);
	const [error, setError] = useState("");
	const [copied, setCopied] = useState(false);
	const link = `${window.location.origin}/artefacts/shared/${artefactId}`;

	useEffect(() => {
		Promise.all([
			request("/organisations"),
			request(`/artefacts/${artefactId}/organisations`),
			request(`/artefacts/${artefactId}/people`),
		])
			.then(
				async ([
					organisationResponse,
					grantResponse,
					peopleResponse,
				]) => {
					if (
						!organisationResponse.ok ||
						!grantResponse.ok ||
						!peopleResponse.ok
					)
						throw new Error();
					setOrganisations(
						(
							(await organisationResponse.json()) as Organisation[]
						).filter(
							(organisation) => organisation.role !== "member",
						),
					);
					setGrants((await grantResponse.json()) as Grant[]);
					setPeople((await peopleResponse.json()) as Person[]);
				},
			)
			.catch(() => setError("Could not load sharing options."));
	}, [artefactId]);

	async function invite(event: FormEvent) {
		event.preventDefault();
		if (!email.trim() || isInviting) return;
		setInviting(true);
		setError("");
		const response = await request(`/artefacts/${artefactId}/people`, {
			method: "PUT",
			body: JSON.stringify({ email, permission: invitePermission }),
		});
		setInviting(false);
		const body = (await response.json().catch(() => ({}))) as Person & {
			error?: string;
		};
		if (!response.ok)
			return setError(body.error ?? "Could not share with that person.");
		setPeople((current) => [
			...current.filter((person) => person.userId !== body.userId),
			body,
		]);
		setEmail("");
	}

	async function changePerson(person: Person, permission: Permission) {
		const response = await request(`/artefacts/${artefactId}/people`, {
			method: "PUT",
			body: JSON.stringify({ email: person.email, permission }),
		});
		if (!response.ok) return setError("Could not change their access.");
		setPeople((current) =>
			current.map((item) =>
				item.userId === person.userId ? { ...item, permission } : item,
			),
		);
	}

	async function removePerson(userId: string) {
		const response = await request(
			`/artefacts/${artefactId}/people/${userId}`,
			{ method: "DELETE" },
		);
		if (!response.ok) return setError("Could not remove their access.");
		setPeople((current) =>
			current.filter((person) => person.userId !== userId),
		);
	}

	async function saveGrant(id: string, permission: Permission) {
		const response = await request(
			`/artefacts/${artefactId}/organisations/${id}`,
			{
				method: "PUT",
				body: JSON.stringify({ permission }),
			},
		);
		if (!response.ok)
			return setError("Could not update organisation access.");
		const organisation = organisations.find((item) => item.id === id);
		const name =
			organisation?.name ??
			grants.find((grant) => grant.organisationId === id)?.name ??
			"";
		setGrants((current) => [
			...current.filter((grant) => grant.organisationId !== id),
			{ organisationId: id, name, permission },
		]);
	}

	async function removeGrant(id: string) {
		const response = await request(
			`/artefacts/${artefactId}/organisations/${id}`,
			{ method: "DELETE" },
		);
		if (!response.ok)
			return setError("Could not revoke organisation access.");
		setGrants((current) =>
			current.filter((grant) => grant.organisationId !== id),
		);
	}

	async function setLinkSharing(on: boolean) {
		const response = await request(
			`/artefacts/${artefactId}/share${on ? "" : "?scope=link"}`,
			{ method: on ? "POST" : "DELETE" },
		);
		if (!response.ok)
			return setError(
				on
					? "Could not turn on link sharing."
					: "Could not turn off link sharing.",
			);
		onSharingChange(on);
	}

	async function stopSharing() {
		const response = await request(`/artefacts/${artefactId}/share`, {
			method: "DELETE",
		});
		if (!response.ok)
			return setError("Could not make this artefact private.");
		setGrants([]);
		setPeople([]);
		onSharingChange(false);
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
		} catch {
			setError("Could not copy the link.");
		}
	}

	const unsharedOrganisations = organisations.filter(
		(organisation) =>
			!grants.some((grant) => grant.organisationId === organisation.id),
	);
	const isPrivate = !isShared && people.length === 0 && grants.length === 0;

	return (
		<Modal>
			<Modal.Backdrop
				isOpen
				onOpenChange={(open) => !open && onClose()}
				variant="blur"
			>
				<Modal.Container placement="center" scroll="inside" size="md">
					<Modal.Dialog
						aria-label="Share artefact"
						className="rounded-2xl p-0"
					>
						<Modal.Header className="flex-row items-center gap-4 border-b border-border px-6 py-4">
							<Modal.Heading className="flex-1">
								Share
							</Modal.Heading>
							<Button
								aria-label="Close share dialog"
								variant="ghost"
								className="size-8 min-w-8 p-0"
								onPress={onClose}
							>
								<X size={18} />
							</Button>
						</Modal.Header>
						<Modal.Body className="m-0 space-y-5 p-6">
							<Form
								onSubmit={invite}
								className="flex items-end gap-2"
							>
								<TextField
									type="email"
									value={email}
									onChange={setEmail}
									className="flex min-w-0 flex-1 flex-col gap-1.5"
								>
									<Label>Invite people</Label>
									<Input
										fullWidth
										placeholder="Email of a Klee account"
									/>
								</TextField>
								<PermissionSelect
									label="Access for invited person"
									value={invitePermission}
									onChange={setInvitePermission}
								/>
								<Button
									type="submit"
									isPending={isInviting}
									isDisabled={!email.trim()}
								>
									Invite
								</Button>
							</Form>

							<section
								aria-label="People with access"
								className="space-y-1"
							>
								{people.map((person) => (
									<div
										key={person.userId}
										className="flex items-center gap-3 py-1.5"
									>
										<UserAvatar
											image={person.image}
											name={person.name || person.email}
											accountId={person.userId}
											size="sm"
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{person.name || person.email}
											</p>
											{person.name && (
												<p className="truncate text-xs text-muted">
													{person.email}
												</p>
											)}
										</div>
										<PermissionSelect
											label={`Access for ${person.name || person.email}`}
											value={person.permission}
											onChange={(permission) =>
												void changePerson(
													person,
													permission,
												)
											}
										/>
										<Button
											aria-label={`Remove ${person.name || person.email}`}
											variant="ghost"
											className="size-8 min-w-8 p-0 text-danger"
											onPress={() =>
												void removePerson(person.userId)
											}
										>
											<Trash2 size={14} />
										</Button>
									</div>
								))}
								{grants.map((grant) => (
									<div
										key={grant.organisationId}
										className="flex items-center gap-3 py-1.5"
									>
										<span className="grid size-8 place-items-center rounded-full bg-surface-secondary">
											<Building2 size={15} />
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">
												{grant.name}
											</p>
											<p className="text-xs text-muted">
												Organisation
											</p>
										</div>
										<PermissionSelect
											label={`Access for ${grant.name}`}
											value={grant.permission}
											onChange={(permission) =>
												void saveGrant(
													grant.organisationId,
													permission,
												)
											}
										/>
										<Button
											aria-label={`Remove ${grant.name}`}
											variant="ghost"
											className="size-8 min-w-8 p-0 text-danger"
											onPress={() =>
												void removeGrant(
													grant.organisationId,
												)
											}
										>
											<Trash2 size={14} />
										</Button>
									</div>
								))}
								{people.length === 0 && grants.length === 0 && (
									<Paragraph size="sm" color="muted">
										Only you can see this artefact.
									</Paragraph>
								)}
							</section>

							{unsharedOrganisations.length > 0 && (
								<Select
									aria-label="Share with an organisation"
									placeholder="Share with an organisation…"
									// Picking one grants view access; the row above then changes it.
									value={null}
									onChange={(key) => {
										if (key)
											void saveGrant(String(key), "view");
									}}
								>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											{unsharedOrganisations.map(
												(organisation) => (
													<ListBox.Item
														key={organisation.id}
														id={organisation.id}
														textValue={
															organisation.name
														}
													>
														{organisation.name}
													</ListBox.Item>
												),
											)}
										</ListBox>
									</Select.Popover>
								</Select>
							)}

							<Separator />

							<div className="flex items-center gap-3">
								<Globe2
									size={18}
									className="shrink-0 text-muted"
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium">
										Anyone with the link
									</p>
									<p className="text-xs text-muted">
										{isShared
											? "Anyone can view. Only invited people can comment or edit."
											: "Off. Only the people above can open the link."}
									</p>
								</div>
								<Switch
									aria-label="Anyone with the link can view"
									isSelected={isShared}
									onChange={(on) => void setLinkSharing(on)}
								>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
								</Switch>
							</div>

							{error && (
								<p role="alert" className="text-sm text-danger">
									{error}
								</p>
							)}
						</Modal.Body>
						<Modal.Footer className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
							{isPrivate ? (
								<span />
							) : (
								<Button
									variant="ghost"
									size="sm"
									className="text-danger"
									onPress={() => void stopSharing()}
								>
									Stop sharing
								</Button>
							)}
							<Button
								variant="secondary"
								onPress={() => void copyLink()}
							>
								{copied ? (
									<Check size={15} />
								) : (
									<Link2 size={15} />
								)}
								{copied ? "Link copied" : "Copy link"}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
