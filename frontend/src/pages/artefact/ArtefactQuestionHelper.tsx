import { Button, Input, Spinner, Surface } from "@heroui/react";
import { ArrowUp, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";

type Message = { role: "user" | "assistant"; text: string };

export function ArtefactQuestionHelper({ artefactId }: { artefactId: string }) {
	const [isOpen, setOpen] = useState(false);
	const [question, setQuestion] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);
	const [isAsking, setAsking] = useState(false);
	const [error, setError] = useState("");
	async function ask(event: FormEvent) {
		event.preventDefault();
		const text = question.trim();
		if (!text || isAsking) return;
		setQuestion("");
		setAsking(true);
		setError("");
		try {
			const response = await fetch(
				`/api/artefacts/${artefactId}/questions`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						question: text,
						history: messages.slice(-6),
					}),
				},
			);
			const body = (await response.json().catch(() => ({}))) as {
				answer?: string;
				error?: string;
			};
			if (!response.ok || !body.answer) throw new Error(body.error);
			setMessages((current) => [
				...current,
				{ role: "user", text },
				{ role: "assistant", text: body.answer! },
			]);
		} catch (cause) {
			setQuestion(text);
			setError(
				cause instanceof Error && cause.message
					? cause.message
					: "Could not answer that question.",
			);
		} finally {
			setAsking(false);
		}
	}
	return (
		<div className="fixed bottom-5 right-5 z-30 w-[min(24rem,calc(100vw-2.5rem))]">
			{isOpen ? (
				<Surface className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<div className="flex items-center gap-2 text-sm font-medium">
							<MessageCircle size={16} /> Ask Klee
						</div>
						<Button
							aria-label="Close helper"
							variant="ghost"
							className="size-7 min-w-7 p-0"
							onPress={() => setOpen(false)}
						>
							<X size={15} />
						</Button>
					</div>
					<div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3 text-sm">
						{messages.length ? (
							messages.map((message, index) => (
								<p
									key={index}
									className={
										message.role === "user"
											? "text-muted"
											: "rounded-xl bg-surface-secondary p-3"
									}
								>
									{message.text}
								</p>
							))
						) : (
							<p className="text-muted">
								Ask about this artefact, its original prompt, or
								the source context captured when it was
								generated.
							</p>
						)}
						{error && <p className="text-danger">{error}</p>}
					</div>
					<form
						onSubmit={ask}
						className="flex gap-2 border-t border-border p-3"
					>
						<Input
							aria-label="Ask about this artefact"
							value={question}
							onChange={(event) =>
								setQuestion(event.target.value)
							}
							placeholder="Ask a follow-up"
							variant="secondary"
							className="min-w-0 flex-1"
						/>
						<Button
							aria-label="Ask Klee"
							type="submit"
							className="size-9 min-w-9 rounded-xl p-0"
							isDisabled={!question.trim()}
							isPending={isAsking}
						>
							{({ isPending }) =>
								isPending ? (
									<Spinner size="sm" color="current" />
								) : (
									<ArrowUp size={16} />
								)
							}
						</Button>
					</form>
				</Surface>
			) : (
				<Button
					aria-label="Ask about this artefact"
					className="ml-auto flex rounded-full shadow-xl"
					onPress={() => setOpen(true)}
				>
					<MessageCircle size={16} /> Ask Klee
				</Button>
			)}
		</div>
	);
}
