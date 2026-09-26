import { Button, TextArea } from "@heroui/react";
import { ArrowLeft, Heart, MessageCircle, Pencil, Reply, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent, ReactNode } from "react";
import { UserAvatar } from "../../components/UserAvatar";

type Anchor = {
	x: number;
	y: number;
	width: number;
	height: number;
	basisWidth?: number;
	basisHeight?: number;
};
type AnchorAdjustment = { commentId: string; pointerId: number; mode: "move" | "resize"; startX: number; startY: number; surfaceWidth: number; surfaceHeight: number; original: Anchor; moved: boolean };
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

const reactions = [
	{ emoji: "❤️", label: "love", Icon: Heart },
];

function userColor(id: string) {
	let hash = 2166136261;
	for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return `hsl(${(hash >>> 0) % 360} 68% 48%)`;
}

function commentApi(artefactId: string, suffix = "", options?: RequestInit, publicView = false) {
	const path = publicView ? `/api/shared/artefacts/${artefactId}/comments` : `/api/artefacts/${artefactId}/comments`;
	return fetch(`${path}${suffix}`, {
		credentials: "include",
		headers: { "Content-Type": "application/json", ...options?.headers },
		...options,
	});
}

function bounded(value: number, max: number) {
	return Math.min(max, Math.max(0, value));
}

function regionBounds(anchor: Anchor) {
	return {
		left: `${anchor.x * 100}%`,
		top: `${anchor.y * 100}%`,
		width: `${anchor.width * 100}%`,
		height: `${anchor.height * 100}%`,
	};
}

function visibleAnchor(anchor: Anchor, width: number, height: number): Anchor {
	if (!anchor.basisWidth || !anchor.basisHeight || !width || !height) return anchor;
	const scale = (width / anchor.basisWidth) / (height / anchor.basisHeight);
	return { ...anchor, y: anchor.y * scale, height: anchor.height * scale };
}

function regionStyle(anchor: Anchor, color: string, highlighted = false) {
	return {
		...regionBounds(anchor),
		borderColor: color,
		backgroundColor: `color-mix(in srgb, ${color} ${highlighted ? 28 : 12}%, transparent)`,
		boxShadow: highlighted ? `0 0 0 2px ${color}` : undefined,
	} as const;
}

export function ArtefactComments({
	artefactId,
	isOwner,
	userId,
	isShared = false,
	canComment = true,
	isOpen,
	onOpenChange,
	onCountChange,
	children,
}: {
	artefactId: string;
	isOwner: boolean;
	userId: string;
	isShared?: boolean;
	canComment?: boolean;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onCountChange: (count: number) => void;
	children: ReactNode;
}) {
	const surfaceRef = useRef<HTMLDivElement>(null);
	const draftInputRef = useRef<HTMLTextAreaElement>(null);
	const [surfaceSize, setSurfaceSize] = useState({ width: 0, height: 0 });
	const dragStart = useRef<{ x: number; y: number } | undefined>(undefined);
	const anchorAdjustment = useRef<AnchorAdjustment | undefined>(undefined);
	const suppressOverlayClick = useRef(false);
	const [comments, setComments] = useState<Comment[]>([]);
	const [draftAnchor, setDraftAnchor] = useState<Anchor>();
	const [dragAnchor, setDragAnchor] = useState<Anchor>();
	const [adjustingAnchor, setAdjustingAnchor] = useState<{ id: string; anchor: Anchor }>();
	const [savingCommentId, setSavingCommentId] = useState<string>();
	const [hoveredCommentId, setHoveredCommentId] = useState<string>();
	const [threadId, setThreadId] = useState<string>();
	const [body, setBody] = useState("");
	const [error, setError] = useState("");
	const [isDrafting, setDrafting] = useState(false);
	const hoverTimeout = useRef<number | undefined>(undefined);
	const pendingReactions = useRef(new Set<string>());

	function showCommentHover(id: string) {
		window.clearTimeout(hoverTimeout.current);
		hoverTimeout.current = undefined;
		setHoveredCommentId(id);
	}

	function hideCommentHover() {
		window.clearTimeout(hoverTimeout.current);
		hoverTimeout.current = window.setTimeout(() => {
			hoverTimeout.current = undefined;
			setHoveredCommentId(undefined);
		}, 700);
	}

	useEffect(() => () => window.clearTimeout(hoverTimeout.current), []);

	useEffect(() => {
		const surface = surfaceRef.current;
		if (!surface) return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSurfaceSize((current) =>
				current.width === width && current.height === height
					? current
					: { width, height },
			);
		});
		observer.observe(surface);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!draftAnchor) return;
		const frame = window.requestAnimationFrame(() => {
			draftInputRef.current?.focus();
			draftInputRef.current?.form?.scrollIntoView({ block: "nearest", inline: "nearest" });
		});
		return () => window.cancelAnimationFrame(frame);
	}, [draftAnchor]);

	useEffect(() => {
		let current = true;
		commentApi(artefactId, "", undefined, isShared && !userId)
			.then(async (response) => {
				if (!response.ok) throw new Error();
				return (await response.json()) as Comment[];
			})
			.then((next) => {
				if (!current) return;
				setComments(next);
			})
			.catch(() => {
				if (current) setError("Could not load comments.");
			});
		return () => {
			current = false;
		};
	}, [artefactId, isShared, userId]);

	useEffect(() => onCountChange(comments.length), [comments.length, onCountChange]);

	function point(event: PointerEvent<HTMLDivElement>) {
		const rect = surfaceRef.current!.getBoundingClientRect();
		return {
			x: bounded(event.clientX - rect.left, rect.width),
			y: bounded(event.clientY - rect.top, rect.height),
		};
	}

	function anchorBetween(start: { x: number; y: number }, end: { x: number; y: number }): Anchor {
		const rect = surfaceRef.current!.getBoundingClientRect();
		const width = Math.max(1, rect.width);
		const height = Math.max(1, rect.height);
		const left = Math.min(start.x, end.x);
		const top = Math.min(start.y, end.y);
		return {
			x: left / width,
			y: top / height,
			width: Math.abs(end.x - start.x) / width,
			height: Math.abs(end.y - start.y) / height,
			basisWidth: width,
			basisHeight: height,
		};
	}

	function startSelection(event: PointerEvent<HTMLDivElement>) {
		if (!canComment || event.button !== 0 || !surfaceRef.current) return;
		const target = event.target as HTMLElement;
		if (target.closest("a,button,input,textarea,[contenteditable=true],.react-flow,[data-comment-ui]")) return;
		event.preventDefault();
		dragStart.current = point(event);
		setDraftAnchor(undefined);
		setDragAnchor(undefined);
		setThreadId(undefined);
		setBody("");
		setError("");
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function moveSelection(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart.current) return;
		const end = point(event);
		const selection = anchorBetween(dragStart.current, end);
		if (selection.width * surfaceRef.current!.clientWidth > 5 || selection.height * surfaceRef.current!.clientHeight > 5)
			setDragAnchor(selection);
	}

	function finishSelection(event: PointerEvent<HTMLDivElement>) {
		if (!dragStart.current) return;
		const start = dragStart.current;
		const selection = anchorBetween(start, point(event));
		dragStart.current = undefined;
		setDragAnchor(undefined);
		if (selection.width * surfaceRef.current!.clientWidth < 12 || selection.height * surfaceRef.current!.clientHeight < 12) return;
		setDraftAnchor(selection);
		setThreadId(undefined);
		setBody("");
		setError("");
		onOpenChange(false);
	}

	function cancelSelection() {
		dragStart.current = undefined;
		setDragAnchor(undefined);
	}

	function canAdjustAnchor(comment: Comment) {
		return canComment && comment.parentId === null && comment.author.id === userId;
	}

	function startAnchorAdjustment(event: PointerEvent<HTMLButtonElement>, comment: Comment) {
		if (!canAdjustAnchor(comment) || savingCommentId || event.button !== 0 || !surfaceRef.current) return;
		event.stopPropagation();
		suppressOverlayClick.current = false;
		const surface = surfaceRef.current;
		anchorAdjustment.current = {
			commentId: comment.id,
			pointerId: event.pointerId,
			mode: (event.target as HTMLElement).closest("[data-comment-resize]") ? "resize" : "move",
			startX: event.clientX,
			startY: event.clientY,
			surfaceWidth: Math.max(1, surface.getBoundingClientRect().width),
			surfaceHeight: Math.max(1, surface.getBoundingClientRect().height),
			original: comment.anchor!,
			moved: false,
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function anchorAt(adjustment: AnchorAdjustment, clientX: number, clientY: number) {
		const basisWidth = adjustment.original.basisWidth ?? adjustment.surfaceWidth;
		const basisHeight = adjustment.original.basisHeight ?? adjustment.surfaceHeight;
		const scaledHeight = basisHeight * adjustment.surfaceWidth / basisWidth;
		const dx = (clientX - adjustment.startX) / adjustment.surfaceWidth;
		const dy = (clientY - adjustment.startY) / scaledHeight;
		const basis = { basisWidth, basisHeight };
		if (adjustment.mode === "move") {
			return {
				...adjustment.original,
				...basis,
				x: bounded(adjustment.original.x + dx, 1 - adjustment.original.width),
				y: bounded(adjustment.original.y + dy, 1 - adjustment.original.height),
			};
		}
		const maxWidth = 1 - adjustment.original.x;
		const maxHeight = 1 - adjustment.original.y;
		return {
			...adjustment.original,
			...basis,
			width: Math.min(maxWidth, Math.max(Math.min(12 / adjustment.surfaceWidth, maxWidth), adjustment.original.width + dx)),
			height: Math.min(maxHeight, Math.max(Math.min(12 / scaledHeight, maxHeight), adjustment.original.height + dy)),
		};
	}

	function moveAnchorAdjustment(event: PointerEvent<HTMLButtonElement>) {
		const adjustment = anchorAdjustment.current;
		if (!adjustment || adjustment.pointerId !== event.pointerId) return;
		if (Math.abs(event.clientX - adjustment.startX) > 3 || Math.abs(event.clientY - adjustment.startY) > 3)
			adjustment.moved = true;
		setAdjustingAnchor({ id: adjustment.commentId, anchor: anchorAt(adjustment, event.clientX, event.clientY) });
	}

	async function persistAnchor(commentId: string, anchor: Anchor, previous: Anchor) {
		setSavingCommentId(commentId);
		setError("");
		setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, anchor } : comment));
		try {
			const response = await commentApi(artefactId, "/" + commentId, {
				method: "PATCH",
				body: JSON.stringify({ anchor }),
			});
			if (!response.ok) throw new Error("Could not update the comment area.");
		} catch (error) {
			setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, anchor: previous } : comment));
			setError(error instanceof Error ? error.message : "Could not update the comment area.");
			onOpenChange(true);
		} finally {
			setSavingCommentId(undefined);
		}
	}

	async function editComment(commentId: string, body: string) {
		const nextBody = body.trim();
		if (!nextBody || nextBody.length > 5000) return false;
		setError("");
		try {
			const response = await commentApi(artefactId, "/" + commentId, {
				method: "PATCH",
				body: JSON.stringify({ body: nextBody }),
			});
			if (!response.ok) throw new Error("Could not update your comment.");
			setComments((current) => current.map((comment) => comment.id === commentId ? { ...comment, body: nextBody } : comment));
			return true;
		} catch (error) {
			setError(error instanceof Error ? error.message : "Could not update your comment.");
			return false;
		}
	}

	function finishAnchorAdjustment(event: PointerEvent<HTMLButtonElement>) {
		const adjustment = anchorAdjustment.current;
		if (!adjustment || adjustment.pointerId !== event.pointerId) return;
		anchorAdjustment.current = undefined;
		setAdjustingAnchor(undefined);
		const moved = adjustment.moved || Math.abs(event.clientX - adjustment.startX) > 3 || Math.abs(event.clientY - adjustment.startY) > 3;
		if (!moved) return;
		suppressOverlayClick.current = true;
		void persistAnchor(adjustment.commentId, anchorAt(adjustment, event.clientX, event.clientY), adjustment.original);
	}

	function cancelAnchorAdjustment(event: PointerEvent<HTMLButtonElement>) {
		if (anchorAdjustment.current?.pointerId !== event.pointerId) return;
		anchorAdjustment.current = undefined;
		setAdjustingAnchor(undefined);
	}

	function post(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const nextBody = body.trim();
		if (!canComment || !nextBody) return;
		const parentId = threadId ?? null;
		const anchor = parentId ? null : draftAnchor ?? null;
		if (!parentId && !anchor) return;
		const pendingId = `pending-${crypto.randomUUID()}`;
		const pending: Comment = {
			id: pendingId,
			parentId,
			body: nextBody,
			anchor,
			createdAt: new Date().toISOString(),
			author: { id: userId, name: "You", image: null },
			reactions: [],
		};
		setComments((current) => [...current, pending]);
		setBody("");
		setDraftAnchor(undefined);
		if (!parentId) setThreadId(pendingId);
		setError("");
		void commentApi(artefactId, "", {
				method: "POST",
				body: JSON.stringify({
					body: nextBody,
					...(parentId ? { parentId } : { anchor }),
				}),
			}, isShared && !canComment)
			.then(async (response) => {
				if (!response.ok) throw new Error("Could not post your comment.");
				return (await response.json()) as Comment;
			})
			.then((comment) => {
				setComments((current) => current.map((item) => item.id === pendingId ? comment : item));
				if (!parentId) setThreadId(comment.id);
			})
			.catch((error) => {
				setComments((current) => current.filter((item) => item.id !== pendingId));
				setBody(nextBody);
				if (parentId) setThreadId(parentId);
				else setDraftAnchor(anchor!);
				setError(error instanceof Error ? error.message : "Could not post your comment.");
			});
	}

	async function react(commentId: string, emoji: string) {
		if (!canComment) return;
		const key = `${commentId}:${emoji}`;
		if (pendingReactions.current.has(key)) return;
		pendingReactions.current.add(key);
		const previous = comments.find((comment) => comment.id === commentId)?.reactions;
		setComments((current) => current.map((comment) => {
			if (comment.id !== commentId) return comment;
			const reaction = comment.reactions.find((item) => item.emoji === emoji);
			const reactions = reaction
				? comment.reactions.map((item) => item.emoji === emoji
					? { ...item, count: item.reacted ? item.count - 1 : item.count + 1, reacted: !item.reacted }
					: item).filter((item) => item.count > 0)
				: [...comment.reactions, { emoji, count: 1, reacted: true }];
			return { ...comment, reactions };
		}));
		setError("");
		try {
			const response = await commentApi(artefactId, `/${commentId}/reactions`, {
				method: "POST",
				body: JSON.stringify({ emoji }),
			}, isShared && !canComment);
			if (!response.ok) throw new Error("Could not add reaction.");
		} catch (error) {
			setComments((current) => current.map((comment) => comment.id === commentId && previous ? { ...comment, reactions: previous } : comment));
			setError(error instanceof Error ? error.message : "Could not add reaction.");
		} finally {
			pendingReactions.current.delete(key);
		}
	}

	async function draftReply() {
		if (!canComment || !threadId || isDrafting) return;
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
	const compose = Boolean(selected);
	const draftDisplayAnchor = draftAnchor && visibleAnchor(draftAnchor, surfaceSize.width, surfaceSize.height);

	return (
		<div className="relative flex min-h-0 flex-1 overflow-hidden">
			<div className="relative min-w-0 flex-1 overflow-auto">
				<div
					ref={surfaceRef}
					className="relative"
					onPointerDown={startSelection}
					onPointerMove={moveSelection}
					onPointerUp={finishSelection}
					onPointerCancel={cancelSelection}
				>
					{children}
					{comments.filter((comment) => comment.anchor).map((comment) => {
						const color = userColor(comment.author.id);
						const anchor = visibleAnchor(adjustingAnchor?.id === comment.id ? adjustingAnchor.anchor : comment.anchor!, surfaceSize.width, surfaceSize.height);
						const highlighted = hoveredCommentId === comment.id;
						const { left, top, width, height, ...boxStyle } = regionStyle(anchor, color, highlighted);
						return (
							<div
								key={comment.id}
								data-comment-region={comment.id}
								className="pointer-events-none absolute z-[60]"
								style={{ left, top, width, height }}
							>
								<button
									type="button"
									data-comment-id={comment.id}
									data-comment-overlay
									aria-hidden={!highlighted}
									aria-label={"Open comment by " + (comment.author.name || "teammate")}
									title={comment.author.name || "Comment"}
									tabIndex={highlighted ? 0 : -1}
									className={canAdjustAnchor(comment) ? "pointer-events-auto absolute inset-0 cursor-move select-none rounded-lg border-2 border-dashed text-left transition-[background-color,box-shadow,opacity] duration-150" : "pointer-events-auto absolute inset-0 rounded-lg border-2 border-dashed text-left transition-[background-color,box-shadow,opacity] duration-150"}
									style={{ ...boxStyle, opacity: highlighted ? 1 : 0, pointerEvents: highlighted ? "auto" : "none", ...(canAdjustAnchor(comment) ? { touchAction: "none" } : {}) }}
									onMouseEnter={() => showCommentHover(comment.id)}
									onMouseLeave={hideCommentHover}
									onFocusCapture={() => showCommentHover(comment.id)}
									onBlurCapture={hideCommentHover}
									onPointerDown={(event) => startAnchorAdjustment(event, comment)}
									onPointerMove={moveAnchorAdjustment}
									onPointerUp={finishAnchorAdjustment}
									onPointerCancel={cancelAnchorAdjustment}
									onClick={() => {
										if (suppressOverlayClick.current) {
											suppressOverlayClick.current = false;
											return;
										}
										openThread(comment.id);
									}}
								>
									{canAdjustAnchor(comment) && <span data-comment-resize className="absolute -bottom-1.5 -right-1.5 size-3.5 cursor-se-resize rounded-sm border-2 border-surface bg-current" style={{ color }} />}
								</button>
								<button
									type="button"
									data-comment-avatar
									aria-label={"Show comment by " + (comment.author.name || "teammate")}
									title={comment.author.name || "Comment"}
									className="pointer-events-auto absolute -left-4 -top-3 z-10 rounded-xl border-2 border-surface bg-surface p-0.5 shadow-sm"
									onMouseEnter={() => showCommentHover(comment.id)}
									onMouseLeave={hideCommentHover}
									onFocus={() => showCommentHover(comment.id)}
									onBlur={hideCommentHover}
									onClick={() => openThread(comment.id)}
								>
									<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
								</button>
								{hoveredCommentId === comment.id && (
									<div
										data-comment-ui
										className="pointer-events-auto absolute z-[70] max-h-64 overflow-y-auto"
										style={{ left: 0, top: "calc(100% + 0.5rem)", width: "min(20rem, calc(100vw - 2rem))" }}
										onMouseEnter={() => showCommentHover(comment.id)}
										onMouseLeave={hideCommentHover}
									>
										<div className="rounded-xl border border-border bg-surface p-3 text-left shadow-xl">
											<div className="flex items-center gap-2">
												<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
												<span className="min-w-0 flex-1 truncate text-sm font-medium">{comment.author.name || "Teammate"}</span>
												<time dateTime={comment.createdAt} className="text-[11px] text-muted">{new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
											</div>
											<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
											{canComment && <button type="button" className="mt-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground" onPointerDown={(event) => event.stopPropagation()} onClick={() => openThread(comment.id)}><Reply size={14} /> Reply</button>}
											</div>
									</div>
								)}
							</div>
						);
					})}
					{(draftAnchor || dragAnchor) && (
						<div
							aria-hidden="true"
							className="pointer-events-none absolute z-[60] rounded-lg border-2 border-dashed border-accent-text bg-accent/15"
							style={regionStyle(draftDisplayAnchor ?? dragAnchor!, userColor(userId))}
						/>
					)}
					{draftAnchor && canComment && (
						<form
							data-comment-ui
							onSubmit={post}
							className="absolute z-[70] rounded-xl border border-border bg-surface p-3 shadow-xl"
							style={{
								left: `max(8px, min(${(draftDisplayAnchor ?? draftAnchor).x * 100}%, calc(100% - 328px)))`,
								top: `${((draftDisplayAnchor ?? draftAnchor).y + (draftDisplayAnchor ?? draftAnchor).height) * 100}%`,
								width: "min(20rem, calc(100vw - 2rem))",
								maxWidth: "calc(100% - 1rem)",
							}}
						>
							<div className="mb-2 flex items-center gap-2">
								<span className="flex-1 text-sm font-medium">Comment on this area</span>
								<button
									type="button"
									aria-label="Cancel comment"
									className="rounded-md p-1 text-muted hover:bg-surface-secondary hover:text-foreground"
									onClick={() => { setDraftAnchor(undefined); setBody(""); setError(""); }}
								>
									<X size={15} />
								</button>
							</div>
							<TextArea
								ref={draftInputRef}
								aria-label="Write a comment"
								rows={3}
								maxLength={5000}
								value={body}
								onChange={(event) => setBody(event.target.value)}
								placeholder="Write a comment…"
								className="w-full resize-none"
							/>
							{error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
							<div className="mt-2 flex justify-end">
								<Button type="submit" size="sm" isDisabled={!body.trim()}>
									Post<Send size={14} />
								</Button>
							</div>
						</form>
					)}
					</div>
			</div>
			{isOpen && (
				<aside
					aria-label="Artefact comments"
					className="absolute right-0 top-0 z-10 flex h-full max-h-full w-[min(22rem,90vw)] flex-col overflow-hidden border-l border-border bg-surface shadow-xl"
				>
					<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
						<MessageCircle size={17} className="text-muted" />
						<h2 className="flex-1 font-semibold">Comments</h2>
						{!canComment && <span className="text-xs text-muted">View only</span>}
						<Button
							aria-label="Collapse comments"
							variant="ghost"
							className="size-8 min-w-8 p-0"
							onPress={() => onOpenChange(false)}
						>
							<X size={16} />
						</Button>
					</header>
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
						{threadId && (
							<div className="mb-3">
								<Button
									variant="ghost"
									size="sm"
									onPress={() => {
										setThreadId(undefined);
										setDraftAnchor(undefined);
										setBody("");
									}}
								>
									<ArrowLeft size={15} /> All comments
								</Button>
							</div>
						)}
						{compose ? (
							<>
								<CommentCard comment={selected!} onReact={react} canComment={canComment} canEdit={canComment && selected!.author.id === userId} onEdit={editComment} />
								{thread.length > 1 && (
									<div className="relative ml-5 border-l border-border pl-4">
										{thread.filter((comment) => comment.id !== selected!.id).map((comment) => (
											<CommentCard key={comment.id} comment={comment} connected onReact={react} canComment={canComment} canEdit={canComment && comment.author.id === userId} onEdit={editComment} />
										))}
									</div>
								)}
							</>
						) : roots.length ? (
							roots.map((comment) => {
								const replyCount = comments.filter((reply) => reply.parentId === comment.id).length;
								return (
									<div
										key={comment.id}
										className="mb-3 rounded-xl border border-border p-3"
									>
										<button
											type="button"
											className="flex w-full items-start gap-2 text-left"
											onClick={() => openThread(comment.id)}
										>
											<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
											<span className="min-w-0 flex-1">
												<span className="block truncate text-sm font-medium">{comment.author.name || "Teammate"}</span>
												<span className="mt-1 block line-clamp-3 text-sm text-muted">{comment.body}</span>
											</span>
										</button>
										<div className="mt-2 flex items-center justify-between gap-2">
											<button type="button" onClick={() => openThread(comment.id)} className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
												<Reply size={14} />
												{canComment
													? replyCount ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"} · Reply` : "Reply"
													: replyCount ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "View thread"}
											</button>
											<ReactionBar comment={comment} onReact={react} canComment={canComment} />
										</div>
									</div>
								);
							})
						) : (
							<p className="py-6 text-center text-sm text-muted">
								{canComment
									? "Drag across an area of the artefact to start a comment."
									: "No comments on this artefact yet."}
							</p>
						)}
					</div>
					{compose && canComment && (
						<form onSubmit={post} className="shrink-0 space-y-2 border-t border-border p-3">
							<TextArea aria-label={selected ? "Reply" : "Comment"} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder={selected ? "Write a reply…" : "Add a comment…"} className="w-full resize-none" />
							{error && <p role="alert" className="text-xs text-danger">{error}</p>}
							<div className="flex items-center justify-between gap-2">
								{selected && isOwner ? <Button type="button" variant="ghost" size="sm" isDisabled={isDrafting} onPress={() => void draftReply()}>{isDrafting ? "Drafting…" : <><Sparkles size={14} /> Draft with AI</>}</Button> : <span />}
								<Button type="submit" size="sm" isDisabled={!body.trim()}>Post<Send size={14} /></Button>
							</div>
						</form>
					)}
					{!compose && error && <p role="alert" className="border-t border-border px-4 py-2 text-xs text-danger">{error}</p>}
				</aside>
			)}
		</div>
	);
}


function CommentCard({ comment, connected = false, onReact, canComment, canEdit, onEdit }: {
	comment: Comment;
	connected?: boolean;
	onReact: (commentId: string, emoji: string) => void;
	canComment: boolean;
	canEdit: boolean;
	onEdit: (commentId: string, body: string) => Promise<boolean>;
}) {
	const [isEditing, setEditing] = useState(false);
	const [body, setBody] = useState(comment.body);
	const [isSaving, setSaving] = useState(false);

	async function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (isSaving || !body.trim()) return;
		setSaving(true);
		if (await onEdit(comment.id, body)) setEditing(false);
		setSaving(false);
	}

	return (
		<article className={`relative mb-3 rounded-xl border border-border p-3 ${connected ? "last:mb-0 before:absolute before:-left-4 before:top-6 before:h-px before:w-4 before:bg-border" : ""}`}>
			<div className="flex items-center gap-2">
				<UserAvatar image={comment.author.image} name={comment.author.name || "Teammate"} size="sm" />
				<span className="min-w-0 flex-1 truncate text-sm font-medium">{comment.author.name || "Teammate"}</span>
				<time dateTime={comment.createdAt} className="text-[11px] text-muted">{new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
			</div>
			{isEditing ? (
				<form data-comment-ui onSubmit={save} className="mt-2 space-y-2">
					<TextArea aria-label="Edit comment" rows={3} maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} className="w-full resize-none" />
					<div className="flex justify-end gap-2">
						<Button type="button" variant="ghost" size="sm" onPress={() => { setBody(comment.body); setEditing(false); }}>Cancel</Button>
						<Button type="submit" size="sm" isDisabled={!body.trim() || isSaving}>{isSaving ? "Saving…" : "Save"}</Button>
					</div>
				</form>
			) : (
				<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
			)}
			<div className="mt-2 flex items-center justify-between gap-2">
				{canEdit && !isEditing && <button type="button" aria-label="Edit comment" className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground" onClick={() => { setBody(comment.body); setEditing(true); }}><Pencil size={13} /> Edit</button>}
				<ReactionBar comment={comment} onReact={onReact} canComment={canComment} />
			</div>
		</article>
	);
}

function ReactionBar({ comment, onReact, canComment }: { comment: Comment; onReact: (commentId: string, emoji: string) => void; canComment: boolean }) {
	return (
		<div className="mt-2 flex flex-wrap gap-1">
			{reactions.map(({ emoji, label, Icon }) => {
				const reaction = comment.reactions.find((item) => item.emoji === emoji);
				if (!canComment) return reaction ? <span key={emoji} aria-label={label + ", " + reaction.count + " reactions"} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"><Icon size={15} strokeWidth={2.75} aria-hidden="true" /> {reaction.count}</span> : null;
				return (
					<button key={emoji} type="button" aria-label={(reaction?.reacted ? "Remove " : "Add ") + label + " reaction"} aria-pressed={reaction?.reacted ?? false} onClick={() => onReact(comment.id, emoji)} className={reaction?.reacted ? "inline-flex items-center gap-1 rounded-full border border-accent-text bg-accent/20 px-2 py-0.5 text-xs" : "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs hover:bg-surface-secondary"}>
						<Icon size={15} strokeWidth={2.75} aria-hidden="true" />{reaction?.count ? " " + reaction.count : ""}
					</button>
				);
			})}
		</div>
	);
}
