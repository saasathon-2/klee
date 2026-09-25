import { Button, Heading, Paragraph } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";

export function Landing() {
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();

	return (
		<main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-6 pb-14 text-center">
			<Heading level={1} align="center" className="max-w-3xl text-5xl text-balance sm:text-6xl">
				Make the next move feel obvious.
			</Heading>
			<Paragraph align="center" color="muted" className="mt-5 max-w-xl text-lg">
				Turn pull requests, tickets, and notes into clear, shareable artefacts.
			</Paragraph>
			<div className="mt-8 flex flex-wrap justify-center gap-3">
				<Button
					size="lg"
					onPress={() => navigate(session?.user ? "/" : "/login")}
				>
					Go to chat
					<ArrowRight size={18} />
				</Button>
				{!isPending && !session?.user && (
					<Button
						size="lg"
						variant="secondary"
						onPress={() => navigate("/login")}
					>
						Sign in
					</Button>
				)}
			</div>
		</main>
	);
}
