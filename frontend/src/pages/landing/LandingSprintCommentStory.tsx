import { Send, X, MousePointer2, Reply } from "lucide-react";
import { Button, TextArea } from "@heroui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserAvatar } from "../../components/UserAvatar";

const sprintComments = [
	{ id: "scope", name: "Priya K", body: "Can we clarify these sprint states before code freeze?", left: "5%", top: "7%", width: "58%", height: "10%" },
	{ id: "review", name: "Jane Doe", body: "This needs an API review before the sprint closes.", left: "73%", top: "75%", width: "18%", height: "9%" },
];

function userColor(id: string) {
	let hash = 2166136261;
	for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
	return `hsl(${(hash >>> 0) % 360} 68% 48%)`;
}

/** Landing-only replay of the artefact comment gesture. */
export function LandingSprintCommentStory({ children }: { children: ReactNode }) {
	const sectionRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const section = sectionRef.current;
		if (!section) return;
		const observer = new IntersectionObserver(
			([entry]) => setVisible(entry.isIntersecting),
			{ threshold: 0.45 },
		);
		observer.observe(section);
		return () => observer.disconnect();
	}, []);

	return (
		<div ref={sectionRef} className="relative">
			{children}
			{visible && <><CommentDemo /><SprintCommentChips /></>}
		</div>
	);
}

function SprintCommentChips() {
	const [hovered, setHovered] = useState<string>();
	const hideTimer = useRef<number | undefined>(undefined);
	const show = (id: string) => {
		window.clearTimeout(hideTimer.current);
		setHovered(id);
	};
	const hide = () => {
		hideTimer.current = window.setTimeout(() => setHovered(undefined), 700);
	};

	useEffect(() => () => window.clearTimeout(hideTimer.current), []);

	return (
		<div className="landing-sprint-comment-chips absolute inset-0 z-20">
			{sprintComments.map((comment) => {
				const open = hovered === comment.id;
				const color = userColor(comment.id);
				return (
					<div key={comment.id} className="landing-sprint-comment-chip absolute pointer-events-none" style={comment}>
						{open && <div className="absolute inset-0 rounded-lg border-2 border-dashed" style={{ borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }} />}
						<button type="button" aria-label={`Show comment by ${comment.name}`} className="pointer-events-auto absolute -left-4 -top-3 z-10 rounded-xl border-2 border-surface bg-surface p-0.5 shadow-sm" onMouseEnter={() => show(comment.id)} onMouseLeave={hide} onFocus={() => show(comment.id)} onBlur={hide}>
							<UserAvatar accountId={comment.id} name={comment.name[0]} size="sm" />
						</button>
						{open && <div className="pointer-events-auto absolute z-[70] max-h-64 overflow-y-auto" style={{ left: 0, top: "calc(100% + 0.5rem)", width: "min(20rem, calc(100vw - 2rem))" }} onMouseEnter={() => show(comment.id)} onMouseLeave={hide}>
							<div className="rounded-xl border border-border bg-surface p-3 text-left shadow-xl">
								<div className="flex items-center gap-2">
									<UserAvatar accountId={comment.id} name={comment.name[0]} size="sm" />
									<span className="min-w-0 flex-1 truncate text-sm font-medium">{comment.name}</span>
									<time className="text-[11px] text-muted">Just now</time>
								</div>
								<p className="mt-2 whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
								<span className="mt-3 inline-flex items-center gap-1 text-xs text-muted"><Reply size={14} /> Reply</span>
							</div>
						</div>}
					</div>
				);
			})}
		</div>
	);
}

function CommentDemo() {
	return (
		<div aria-hidden className="landing-sprint-comment pointer-events-none absolute inset-0 z-10">
			<div className="landing-comment-selection" />
			<div className="landing-comment-composer rounded-xl border border-border bg-surface p-3 shadow-xl">
				<div className="mb-2 flex items-center gap-2">
					<span className="flex-1 text-sm font-medium">Comment on this area</span>
					<button type="button" aria-label="Cancel comment" className="rounded-md p-1 text-muted hover:bg-surface-secondary hover:text-foreground">
						<X size={15} />
					</button>
				</div>
				<div className="relative">
					<TextArea aria-label="Write a comment" rows={3} readOnly className="w-full resize-none" />
					<span className="landing-comment-typed">Can we get a review before code freeze?</span>
				</div>
				<div className="mt-2 flex justify-end">
					<Button type="button" size="sm">Post <Send size={14} /></Button>
				</div>
			</div>
			<span className="landing-comment-click" />
			<MousePointer2 className="landing-comment-cursor" size={21} strokeWidth={1.75} />
		</div>
	);
}
