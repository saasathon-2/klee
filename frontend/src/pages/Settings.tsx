import { Button, Input, Label, Switch, TextField } from "@heroui/react";
import { ArrowLeft, Upload } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { updateUser, useSession } from "../lib/auth-client";
import { UserAvatar } from "../components/UserAvatar";
import { type Theme } from "../lib/theme-context";
import { useTheme } from "../lib/use-theme";
import { useDocumentTitle } from "../useDocumentTitle";

export function Settings() {
	useDocumentTitle("Settings - Klee");
	const { data: session } = useSession();
	const { theme, setTheme } = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const [name, setName] = useState<string>();
	const [image, setImage] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [notifications, setNotifications] = useState(
		() => localStorage.getItem("notifications") !== "off",
	);
	const user = session?.user;
	const displayName = (name ?? user?.name ?? "").trim();

	async function save() {
		if (!displayName) return setMessage("Display name is required.");
		if (displayName.length > 80)
			return setMessage("Display name must be 80 characters or fewer.");
		setSaving(true);
		setMessage("");
		const { error } = await updateUser({
			name: displayName,
			image: image ?? user?.image ?? null,
		});
		setSaving(false);
		setMessage(error ? "Could not save your profile." : "Profile saved.");
	}

	async function upload(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		if (
			!/image\/(jpeg|png|webp)/.test(file.type) ||
			file.size > 5 * 1024 * 1024
		)
			return setMessage("Use a PNG, JPEG, or WebP image up to 5 MB.");
		setSaving(true);
		setMessage("");
		const response = await fetch("/api/profile/avatar", {
			method: "PUT",
			credentials: "include",
			headers: { "Content-Type": file.type },
			body: file,
		});
		const data = (await response.json().catch(() => ({}))) as {
			image?: string;
			error?: string;
		};
		setSaving(false);
		if (!response.ok || !data.image)
			return setMessage(data.error ?? "Could not upload profile image.");
		setImage(data.image);
	}

	function updateNotifications(value: boolean) {
		setNotifications(value);
		localStorage.setItem("notifications", value ? "on" : "off");
	}

	const from = (location.state as { from?: string } | null)?.from ?? "/";
	return (
		<main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
			<Button variant="ghost" onPress={() => navigate(from)}>
				<ArrowLeft size={16} />
				Back to artefacts
			</Button>
			<h1 className="mt-8 text-4xl font-semibold">Settings</h1>
			<p className="mt-2 text-muted">
				Manage how Klee looks and how you appear to your team.
			</p>

			<section className="mt-10 rounded-2xl bg-surface p-6">
				<h2 className="text-lg font-semibold">Profile</h2>
				<div className="mt-5 flex flex-wrap items-center gap-4">
					<UserAvatar
						size="lg"
						image={image ?? user?.image}
						name={displayName || "Profile"}
						accountId={user?.id ?? "profile"}
					/>
					<label className="cursor-pointer">
						<span className="inline-flex h-9 items-center gap-2 rounded-md bg-default px-3 text-sm font-medium">
							<Upload size={16} />
							Upload photo
						</span>
						<input
							className="sr-only"
							type="file"
							accept="image/png,image/jpeg,image/webp"
							onChange={upload}
						/>
					</label>
				</div>
				<TextField
					className="mt-6"
					value={name ?? user?.name ?? ""}
					onChange={setName}
				>
					<Label>Display name</Label>
					<Input maxLength={80} />
				</TextField>
				<div className="mt-5 flex items-center gap-3">
					<Button onPress={save} isDisabled={saving || !displayName}>
						{saving ? "Saving…" : "Save profile"}
					</Button>
					{message && (
						<span className="text-sm text-muted">{message}</span>
					)}
				</div>
			</section>

			<section className="mt-6 rounded-2xl bg-surface p-6">
				<h2 className="text-lg font-semibold">Appearance</h2>
				<div className="mt-5 flex gap-2">
					{(["light", "dark"] as Theme[]).map((value) => (
						<Button
							key={value}
							variant={theme === value ? "primary" : "ghost"}
							className={
								theme === value
									? undefined
									: "bg-default text-foreground hover:bg-default"
							}
							onPress={() => setTheme(value)}
						>
							{value === "light" ? "Light" : "Dark"}
						</Button>
					))}
				</div>
			</section>

			<section className="mt-6 rounded-2xl bg-surface p-6">
				<div className="flex items-center justify-between gap-5">
					<div>
						<h2 className="text-lg font-semibold">Notifications</h2>
						<p className="mt-1 text-sm text-muted">
							Allow Klee to notify you when the browser supports
							it.
						</p>
					</div>
					<Switch
						isSelected={notifications}
						onChange={updateNotifications}
						aria-label="Allow notifications"
					>
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch>
				</div>
			</section>

			<section
				id="developers"
				className="mt-6 rounded-2xl bg-surface p-6"
			>
				<h2 className="text-lg font-semibold">For developers</h2>
				<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
					<div>
						<dt className="text-muted">Build version</dt>
						<dd className="font-mono">{__BUILD_VERSION__}</dd>
					</div>
					<div>
						<dt className="text-muted">Last updated</dt>
						<dd>
							{new Intl.DateTimeFormat(undefined, {
								dateStyle: "medium",
								timeStyle: "short",
							}).format(new Date(__BUILD_UPDATED_AT__))}
						</dd>
					</div>
				</dl>
			</section>
		</main>
	);
}
