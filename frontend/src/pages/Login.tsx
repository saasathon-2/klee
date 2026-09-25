import { useState } from "react";
import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signIn } from "../lib/auth-client";

export function Login() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		setIsSubmitting(true);
		const { error: signInError } = await signIn.email({ email, password });
		setIsSubmitting(false);

		if (signInError) {
			setError(signInError.message ?? "Something went wrong");
			return;
		}

		navigate("/");
	}

	async function handleSocialSignIn(provider: "google" | "github") {
		setError(null);
		const { error: signInError } = await signIn.social({
			provider,
			callbackURL: "/",
		});
		if (signInError) {
			setError(signInError.message ?? "Something went wrong");
		}
	}

	return (
		<main className="mx-auto max-w-md px-6 py-16">
			<Card>
				<Card.Header><Card.Title>Sign in</Card.Title></Card.Header>
				<Card.Content>
			<Form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<TextField
					name="email"
					type="email"
					isRequired
					className="flex flex-col gap-1.5"
				>
					<Label>Email</Label>
					<Input fullWidth />
				</TextField>

				<TextField
					name="password"
					type="password"
					isRequired
					className="flex flex-col gap-1.5"
				>
					<Label>Password</Label>
					<Input fullWidth />
				</TextField>

				{error && (
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				)}

				<Button type="submit" fullWidth isDisabled={isSubmitting}>
					Sign in
				</Button>
			</Form>

			<Button
				variant="ghost"
				fullWidth
				className="mt-3"
				onPress={() => handleSocialSignIn("google")}
			>
				Continue with Google
			</Button>
			<Button
				variant="ghost"
				fullWidth
				className="mt-2"
				onPress={() => handleSocialSignIn("github")}
			>
				Continue with GitHub
			</Button>

			<p className="mt-4 text-sm text-muted">
				No account?{" "}
				<RouterLink to="/register" className="underline underline-offset-4">
					Register
				</RouterLink>
			</p>
				</Card.Content>
			</Card>
		</main>
	);
}
