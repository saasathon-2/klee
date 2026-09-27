import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	basePath: "/api/auth",
});

export const { signIn, signUp, signOut, updateUser, useSession } = authClient;

export type SocialProvider = "google" | "github";

/**
 * Starts Google or GitHub sign-in. The callback URLs are absolute because
 * better-auth resolves relative ones against the API's base URL, which would
 * leave the user on the API instead of back in the app.
 */
export function socialSignIn(provider: SocialProvider) {
	const origin = window.location.origin;
	return signIn.social({
		provider,
		callbackURL: `${origin}/`,
		newUserCallbackURL: `${origin}/`,
		errorCallbackURL: `${origin}/?auth=signin`,
	});
}

/** Links a GitHub login to the signed-in user, returning to `returnPath`. */
export function linkGitHub(returnPath: string) {
	const origin = window.location.origin;
	return authClient.linkSocial({
		provider: "github",
		callbackURL: `${origin}${returnPath}`,
		errorCallbackURL: `${origin}${returnPath}`,
	});
}

/** Adds per-file Google Drive access to the signed-in Google account. */
export function linkGoogleDrive(returnPath: string) {
	const origin = window.location.origin;
	return authClient.linkSocial({
		provider: "google",
		scopes: ["https://www.googleapis.com/auth/drive.file"],
		additionalParams: { access_type: "offline", prompt: "consent" },
		callbackURL: `${origin}${returnPath}`,
		errorCallbackURL: `${origin}${returnPath}`,
	});
}

/** Readable messages for the `?error=` codes better-auth redirects back with. */
export function authErrorMessage(code: string) {
	const messages: Record<string, string> = {
		access_denied: "Sign-in was cancelled.",
		state_mismatch: "That sign-in link expired. Please try again.",
		please_restart_the_process:
			"That sign-in link expired. Please try again.",
		account_not_linked:
			"This email already has an account. Sign in the way you did before, then link this provider from Integrations.",
		email_not_found:
			"Your account doesn't share an email address, so we couldn't sign you in.",
		unable_to_link_account:
			"We couldn't link that account. Please try again.",
		email_does_not_match:
			"Use the same Google email address as your Klee account.",
		account_already_linked_to_different_user:
			"That Google account is already linked to a different Klee account.",
	};
	return (
		messages[code] ?? "Something went wrong signing in. Please try again."
	);
}
