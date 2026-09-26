import { Spinner } from "@heroui/react";

/** Full-page placeholder while a route's code or the session loads. */
export function PageLoader({ label = "Loading" }: { label?: string }) {
	return (
		<main role="status" aria-label={label} className="grid min-h-[60vh] place-items-center">
			<Spinner size="lg" />
		</main>
	);
}
