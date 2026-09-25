import { useState } from "react";
import { Button, Form, Input, Label, TextField } from "@heroui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { signIn, signUp } from "../lib/auth-client";

export function Register() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);

		const formData = new FormData(event.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		setIsSubmitting(true);
		const { error: signUpError } = await signUp.email({
			name,
			email,
			password,
		});
		setIsSubmitting(false);

		if (signUpError) {
			setError(signUpError.message ?? "Something went wrong");
			return;
		}

		navigate("/");
	}

	async function handleGoogleSignIn() {
		setError(null);
		const { error: signInError } = await signIn.social({
			provider: "google",
			callbackURL: "/",
		});
		if (signInError) {
			setError(signInError.message ?? "Something went wrong");
		}
	}

	return (
		<main className="mx-auto max-w-sm px-6 py-16">
			<h1 className="mb-6 text-3xl font-semibold">Register</h1>

			<Form onSubmit={handleSubmit} className="flex flex-col gap-4">
				<TextField name="name" isRequired className="flex flex-col gap-1.5">
					<Label>Name</Label>
					<Input fullWidth />
				</TextField>

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
					minLength={8}
					className="flex flex-col gap-1.5"
				>
					<Label>Password</Label>
					<Input fullWidth />
				</TextField>

				{error && (
					<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
				)}

				<Button type="submit" fullWidth isDisabled={isSubmitting}>
					Create account
				</Button>
			</Form>

			<Button
				variant="ghost"
				fullWidth
				className="mt-3"
				onPress={handleGoogleSignIn}
			>
				Continue with Google
			</Button>

			<p className="mt-4 text-sm text-black/60 dark:text-white/60">
				Already have an account?{" "}
				<RouterLink to="/login" className="underline underline-offset-4">
					Log in
				</RouterLink>
			</p>
		</main>
	);
}
