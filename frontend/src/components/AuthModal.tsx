import {
	Alert,
	Button,
	FieldError,
	Form,
	Input,
	Label,
	Modal,
	Paragraph,
	Separator,
	TextField,
} from "@heroui/react";
import { ArrowLeft, GitPullRequest, Globe, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	authErrorMessage,
	signIn,
	signUp,
	socialSignIn,
	type SocialProvider,
} from "../lib/auth-client";

type Mode = "signin" | "signup";
type Providers = Record<SocialProvider, boolean>;

const copy = {
	signin: {
		heading: "Sign in to Klee",
		description: "Pick up where you left off.",
		email: "Sign in with email",
		submit: "Sign in",
		switchPrompt: "No account?",
		switchAction: "Create one",
	},
	signup: {
		heading: "Create your Klee account",
		description: "Turn pull requests, tickets, and notes into shareable artefacts.",
		email: "Create an account with email",
		submit: "Create account",
		switchPrompt: "Already have an account?",
		switchAction: "Sign in",
	},
} as const;

/**
 * Sign-in and sign-up modal, opened on any public page with `?auth=signin`
 * or `?auth=signup`. The first page offers Google, GitHub, and email; the
 * second page is the email form. OAuth failures come back as `&error=<code>`.
 */
export function AuthModal() {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const param = searchParams.get("auth");
	const mode: Mode | null = param === "signin" || param === "signup" ? param : null;
	const oauthError = searchParams.get("error");
	const [page, setPage] = useState<"options" | "email">("options");
	const [providers, setProviders] = useState<Providers>();
	const [error, setError] = useState("");
	const [pending, setPending] = useState<SocialProvider | "email">();

	useEffect(() => {
		fetch("/api/auth-providers")
			.then((response) => (response.ok ? response.json() : Promise.reject()))
			.then(setProviders)
			// If the API can't say, offer both; the provider reports any problem.
			.catch(() => setProviders({ google: true, github: true }));
	}, []);

	function updateParams(update: (params: URLSearchParams) => void) {
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			update(next);
			return next;
		});
	}
	function close() {
		updateParams((params) => {
			params.delete("auth");
			params.delete("error");
			params.delete("error_description");
		});
		setPage("options");
		setError("");
	}
	function switchMode(next: Mode) {
		updateParams((params) => {
			params.set("auth", next);
			params.delete("error");
		});
		setError("");
	}

	async function social(provider: SocialProvider) {
		setError("");
		setPending(provider);
		// On success the browser leaves for the provider, so only errors come back here.
		const { error: signInError } = await socialSignIn(provider);
		setPending(undefined);
		if (signInError) setError(signInError.message ?? "Could not start sign-in.");
	}

	async function submitEmail(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!mode) return;
		setError("");
		setPending("email");
		const form = new FormData(event.currentTarget);
		const email = String(form.get("email"));
		const password = String(form.get("password"));
		const { error: authError } =
			mode === "signup"
				? await signUp.email({ name: String(form.get("name")), email, password })
				: await signIn.email({ email, password });
		setPending(undefined);
		if (authError) return setError(authError.message ?? "Something went wrong.");
		close();
		navigate("/");
	}

	if (!mode) return null;
	const text = copy[mode];
	const message = error || (oauthError ? authErrorMessage(oauthError) : "");
	const hasSocial = providers && (providers.google || providers.github);

	return (
		<Modal>
			<Modal.Backdrop
				isOpen
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<Modal.Container placement="center" size="sm">
					<Modal.Dialog aria-label={text.heading}>
						<Modal.CloseTrigger />
						<Modal.Header className="flex-row items-center gap-2">
							{page === "email" && (
								<Button
									aria-label="Back"
									variant="ghost"
									className="size-8 min-w-8 p-0"
									onPress={() => {
										setPage("options");
										setError("");
									}}
								>
									<ArrowLeft size={17} />
								</Button>
							)}
							<Modal.Heading>
								{page === "email" ? text.email : text.heading}
							</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="flex flex-col gap-4">
							{page === "options" && (
								<Paragraph size="sm" color="muted">
									{text.description}
								</Paragraph>
							)}
							{message && (
								<Alert status="danger">
									<Alert.Indicator />
									<Alert.Content>
										<Alert.Description>{message}</Alert.Description>
									</Alert.Content>
								</Alert>
							)}

							{page === "options" ? (
								<div className="flex flex-col gap-2">
									{providers?.google && (
										<Button
											variant="secondary"
											fullWidth
											isDisabled={pending !== undefined}
											onPress={() => void social("google")}
										>
											<Globe size={17} />
											{pending === "google" ? "Redirecting…" : "Continue with Google"}
										</Button>
									)}
									{providers?.github && (
										<Button
											variant="secondary"
											fullWidth
											isDisabled={pending !== undefined}
											onPress={() => void social("github")}
										>
											<GitPullRequest size={17} />
											{pending === "github" ? "Redirecting…" : "Continue with GitHub"}
										</Button>
									)}
									{hasSocial && (
										<div className="my-2 flex items-center gap-3">
											<Separator className="flex-1" />
											<Paragraph size="xs" color="muted">
												or
											</Paragraph>
											<Separator className="flex-1" />
										</div>
									)}
									<Button
										variant={hasSocial ? "ghost" : "primary"}
										fullWidth
										onPress={() => {
											setPage("email");
											setError("");
										}}
									>
										<Mail size={17} />
										Continue with email
									</Button>
								</div>
							) : (
								<Form onSubmit={submitEmail} className="flex flex-col gap-4">
									{mode === "signup" && (
										<TextField name="name" isRequired className="flex flex-col gap-1.5">
											<Label>Name</Label>
											<Input fullWidth autoComplete="name" />
											<FieldError />
										</TextField>
									)}
									<TextField name="email" type="email" isRequired className="flex flex-col gap-1.5">
										<Label>Email</Label>
										<Input fullWidth autoComplete="email" />
										<FieldError />
									</TextField>
									<TextField
										name="password"
										type="password"
										isRequired
										minLength={mode === "signup" ? 8 : undefined}
										className="flex flex-col gap-1.5"
									>
										<Label>Password</Label>
										<Input
											fullWidth
											autoComplete={mode === "signup" ? "new-password" : "current-password"}
										/>
										<FieldError />
									</TextField>
									<Button type="submit" fullWidth isDisabled={pending !== undefined}>
										{pending === "email" ? "Please wait…" : text.submit}
									</Button>
								</Form>
							)}
						</Modal.Body>
						<Modal.Footer className="justify-center">
							<Paragraph size="sm" color="muted">
								{text.switchPrompt}
							</Paragraph>
							<Button
								variant="ghost"
								size="sm"
								onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}
							>
								{text.switchAction}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
