import { Button, TextArea } from "@heroui/react";
import { ArrowLeft, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent, ReactNode } from "react";
import { UserAvatar } from "../../components/UserAvatar";

type Anchor = { x: number; y: number; width: number; height: number };
type Reaction = { emoji: string; count: number; reacted: boolean };
type Comment = {
	id: string;
	parentId: string | null;
	body: string;
	anchor: Anchor | null;
	createdAt: string;
	author: { id: string; name: string | null; image: string | null };
	reactions: Reaction[];
};

const emojis = ["👍", "❤️", "🎉", "👀"];

function userColor(id: string) {
	let hash = 2166136261;
	for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return `hsl(${(hash >>> 0) % 360} 68% 48%)`;
}

function commentApi(artefactId: string, suffix = "", options?: RequestInit) {
	return fetch(`/api/artefacts/${artefactId}/comments${suffix}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...options?.headers },
		...options,
	});
}

function bounded(value: number, max: number) {
	return Math.min(max, Math.max(0, value));
}

function regionStyle(anchor: Anchor, color: string) {
	return {
		left: `${anchor.x * 100}%`,
		top: `${anchor.y * 100}%`,
		width: `${anchor.width * 100}%`,
		height: `${anchor.height * 100}%`,
		borderColor: color,
		backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
	} as const;
}

export function ArtefactComments({
	artefactId,
	isOwner,
	userId,
	isOpen,
	onOpenChange,
	onCountChange,
	children,
}: {
	artefactId: string;
	isOwner: boolean;
	userId: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onCountChange: (count: number) => void;
	children: ReactNode;
}) {
	const surfaceRef = useRef<HTMLDivElement>(null);
	const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);
	const [comments, setComments] = useState<Comment[]>([]);
	const [draftAnchor, setDraftAnchor] = useState<Anchor>();
	const [dragAnchor, setDragAnchor] = useState<Anchor>();
	const [threadId, setThreadId] = useState<string>();
	const [body, setBody] = useState("");
	const [error, setError] = useState("");
	const [isPosting, setPosting] = useState(false);
	const [isDrafting, setDrafting] = useState(false);

	const loadComments = useCallback(async () => {
		const response = await commentApi(artefactId);
		if (!response.ok) throw new Error("Could not load comments.");
		const next = (await response.json()) as Comment[];
		setComments(next);
		onCountChange(next.length);
	}, [artefactId, onCountChange]);

	useEffect(() => {
		let current = true;
		commentApi(artefactId)
			.then(async (response) => {
				if (!response.ok) throw new Error();
				return (await response.json()) as Comment[];
			})
			.then((next) => {
				if (!current) return;
				setComments(next);
				onCountChange(next.length);
			})
			.catch(() => {
				if (current) setError("Could not load comments.");
			});
		return () => {
			current = false;
		};
	}, [artefactId, onCountChange]);

	function point(event: PointerEvent<HTMLDivElement>) {
		const rect = surfaceRef.current!.getBoundingClientRect();
		return {
			x: bounded(event.clientX - rect.left, surfaceRef.current!.clientWidth),
			y: bounded(event.clientY - rect.top, surfaceRef.current!.scrollHeight),
		};
	}

	function anchorBetween(start: { x: number; y: number }, end: { x: number; y: number }): Anchor {
		const width = Math.max(1, surfaceRef.current!.clientWidth);
		const height = Math.max(1, surfaceRef.current!.scrollHeight);
		const left = Math.min(start.x, end.x);
		const top = Math.min(start.y, end.y);
		return {
			x: left / width,
			y: top / height,
			width: Math.abs(end.x - start.x) / width,
			height: Math.abs(end.y - start.y) / height,
		};
	}

	function startSelection(event: PointerEvent<HTMLDivElement>) {
		if (event.button !== 0 || !surfaceRef.current) return;
		const target = event.target as HTMLElement;
		if (target.closest("a,button,input,textarea,[contenteditable=true],.react-flow")) return;
		event.preventDefault();
		dragStart.current = point(event);
		setDragAnchor(undefined);
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function moveSelection(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart.current) return;
		const end = point(event);
		const selection = anchorBetween(dragStart.current, end);
		if (selection.width * surfaceRef.current!.clientWidth > 5 || selection.height * surfaceRef.current!.scrollHeight > 5)
			setDragAnchor(selection);
	}

	function finishSelection(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart.current) return;
		const start = dragStart.current;
		const selection = anchorBetween(start, point(event));
		dragStart.current = undefined;
		setDragAnchor(undefined);
		if (selection.width * surfaceRef.current!.clientWidth < 12 || selection.height * surfaceRef.current!.scrollHeight < 12) return;
		setDraftAnchor(selection);
		setThreadId(undefined);
		setBody("");
		setError("");
		onOpenChange(true);
	}

	function cancelSelection() {
		dragStart.current = undefined;
		setDragAnchor(undefined);
	}

	async function post(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!body.trim() || isPosting) return;
		setPosting(true);
		setError("");
		try {
			const response = await commentApi(artefactId, "", {
				method: "POST",
				body: JSON.stringify({
					body: body.trim(),
					...(threadId ? { parentId: threadId } : { anchor: draftAnchor }),
				}),
			});
			if (!response.ok) throw new Error("Could not post your comment.");
			const result = (await response.json()) as { id: string };
			setBody("");
			if (!threadId) setThreadId(result.id);
			setDraftAnchor(undefined);
			await loadComments();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not post your comment.");
		} finally {
			setPosting(false);
		}
	}

	async function react(commentId: string, emoji: string) {
		setError("");
		try {
			const response = await commentApi(artefactId, `/${commentId}/reactions`, {
				method: "POST",
				body: JSON.stringify({ emoji }),
			});
			if (!response.ok) throw new Error("Could not add reaction.");
			await loadComments();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not add reaction.");
		}
	}

	async function draftReply() {
		if (!threadId || isDrafting) return;
		setDrafting(true);
		setError("");
		try {
			const response = await commentApi(artefactId, "/ai-reply", {
				method: "POST",
				body: JSON.stringify({ parentId: threadId }),
			});
			if (!response.ok) throw new Error("Could not draft an AI reply.");
			const result = (await response.json()) as { text: string };
			setBody(result.text);
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not draft an AI reply.");
		} finally {
			setDrafting(false);
		}
	}

	function openThread(id: string) {
		setThreadId(id);
		setDraftAnchor(undefined);
		setError("");
		onOpenChange(true);
		surfaceRef.current?.querySelector(`[data-comment-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
	}

	const roots = comments.filter((comment) => !comment.parentId);
	const thread = threadId ? comments.filter((comment) => comment.id === threadId || comment.parentId === threadId) : [];
	const selected = comments.find((comment) => comment.id === threadId);
	const compose = Boolean(draftAnchor || selected);

	return (
		<div className="relative flex min-h-0 flex-1 overflow-hidden">
			<div className="relative min-w-0 flex-1 overflow-auto">
				<div
					ref={surfaceRef}
					className="relative min-h-full"
					onPointerDown={startSelection}
					onPointerMove={moveSelection}
					onPointerUp={finishSelection}
					onPointerCancel={cancelSelection}
				>
					{children}
					{comments.filter((comment) => comment.anchor).map((comment) => {
						const color = userColor(comment.author.id);
						return (
							<button
								key={comment.id}
								type="button"
								data-comment-id={comment.id}
								data-comment-overlay
								aria-label={`Open comment by ${comment.author.name || "teammate"}`}
								title={comment.author.name || "Comment"}
								className="absolute z-[5] rounded-lg border-2 text-left"
								style={regionStyle(comment.anchor!, color)}
								onClick={() => openThread(comment.id)}
							>
								<span className="absolute -right-2 -top-3 leading-none">
									<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
								</span>
							</button>
						);
					})}
					{(draftAnchor || dragAnchor) && (
						<div
							aria-hidden="true"
							className="pointer-events-none absolute z-[6] rounded-lg border-2 border-dashed border-accent-text bg-accent/15"
							style={regionStyle(draftAnchor ?? dragAnchor!, userColor(userId))}
						/>
					)}
				</div>
			</div>
			{isOpen && (
				<aside aria-label="Artefact comments" className="absolute inset-y-0 right-0 z-10 flex w-[min(22rem,90vw)] flex-col border-l border-border bg-surface shadow-xl">
					<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
						<MessageCircle size={17} className="text-muted" />
						<h2 className="flex-1 font-semibold">Comments</h2>
						<Button aria-label="Collapse comments" variant="ghost" className="size-8 min-w-8 p-0" onPress={() => onOpenChange(false)}><X size={16} /></Button>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
						{threadId ? (
							<div className="mb-3">
								<Button variant="ghost" size="sm" onPress={() => { setThreadId(undefined); setDraftAnchor(undefined); setBody(""); }}><ArrowLeft size={15} /> All comments</Button>
							</div>
						) : null}
						{draftAnchor && <p className="mb-3 text-xs text-muted">Commenting on the selected area</p>}
						{compose ? thread.map((comment) => (
							<CommentCard key={comment.id} comment={comment} onReact={react} />
						)) : roots.length ? roots.map((comment) => {
							const replyCount = comments.filter((reply) => reply.parentId === comment.id).length;
							return (
								<div key={comment.id} className="mb-3 rounded-xl border border-border p-3">
									<button type="button" className="flex w-full items-start gap-2 text-left" onClick={() => openThread(comment.id)}>
										<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
										<span className="min-w-0 flex-1">
											<span className="block truncate text-sm font-medium">{comment.author.name || "Teammate"}</span>
											<span className="mt-1 block line-clamp-3 text-sm text-muted">{comment.body}</span>
											<span className="mt-2 block text-xs text-muted">{replyCount ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Reply"}</span>
										</span>
									</button>
									<ReactionBar comment={comment} onReact={react} />
								</div>
							);
						}) : <p className="py-6 text-center text-sm text-muted">Drag across an area of the artefact to start a comment.</p>}
					</div>
					{compose && (
						<form onSubmit={post} className="shrink-0 space-y-2 border-t border-border p-3">
							<TextArea aria-label={selected ? "Reply" : "Comment"} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder={selected ? "Write a reply…" : "Add a comment…"} className="w-full resize-none" />
							{error && <p role="alert" className="text-xs text-danger">{error}</p>}
							<div className="flex items-center justify-between gap-2">
								{selected && isOwner ? <Button type="button" variant="ghost" size="sm" isDisabled={isDrafting} onPress={() => void draftReply()}>{isDrafting ? "Drafting…" : <><Sparkles size={14} /> Draft with AI</>}</Button> : <span />}
								<Button type="submit" size="sm" isDisabled={!body.trim() || isPosting}>{isPosting ? "Posting…" : "Post"}<Send size={14} /></Button>
							</div>
						</form>
					)}
					{!compose && error && <p role="alert" className="border-t border-border px-4 py-2 text-xs text-danger">{error}</p>}
				</aside>
			)}
		</div>
	);
}

function CommentCard({ comment, onReact }: { comment: Comment; onReact: (commentId: string, emoji: string) => void }) {
	return (
		<article className={`mb-3 rounded-xl border border-border p-3 ${comment.parentId ? "ml-5" : ""}`}>
			<div className="flex items-center gap-2">
				<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
				<span className="min-w-0 flex-1 truncate text-sm font-medium">{comment.author.name || "Teammate"}</span>
				<time className="text-[11px] text-muted">{new Date(comment.createdAt).toLocaleDateString()}</time>
			</div>
			<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
			<ReactionBar comment={comment} onReact={onReact} />
		</article>
	);
}

function ReactionBar({ comment, onReact }: { comment: Comment; onReact: (commentId: string, emoji: string) => void }) {
	return (
		<div className="mt-2 flex flex-wrap gap-1">
			{emojis.map((emoji) => {
				const reaction = comment.reactions.find((item) => item.emoji === emoji);
				return (
					<button key={emoji} type="button" aria-label={`${reaction?.reacted ? "Remove" : "Add"} ${emoji} reaction`} aria-pressed={reaction?.reacted ?? false} onClick={() => onReact(comment.id, emoji)} className={`rounded-full border px-2 py-0.5 text-xs ${reaction?.reacted ? "border-accent-text bg-accent/20" : "border-border hover:bg-surface-secondary"}`}>
						{emoji}{reaction?.count ? ` ${reaction.count}` : ""}
					</button>
				);
			})}
		</div>
	);
}
