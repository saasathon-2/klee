import {
	Card,
	Chip,
	Paragraph,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { FileCode2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DiffHunk, DiffLine } from "../../model";
import { BlockSection } from "../page/BlockSection";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

type Mode = "split" | "unified";
type NumberedLine = DiffLine & { number: number };
type UnifiedRow = DiffLine & { oldNumber?: number; newNumber?: number };
type SplitRow = { old?: NumberedLine; new?: NumberedLine };

const lineTone: Record<DiffLine["kind"], string> = {
	context: "",
	add: "bg-success/10",
	remove: "bg-danger/10",
};
const signTone: Record<DiffLine["kind"], string> = {
	context: "text-muted",
	add: "text-success",
	remove: "text-danger",
};
const lineSign: Record<DiffLine["kind"], string> = {
	context: " ",
	add: "+",
	remove: "-",
};

function unifiedRows(hunk: DiffHunk): UnifiedRow[] {
	let oldNumber = hunk.oldStart;
	let newNumber = hunk.newStart;
	return hunk.lines.map((line) => ({
		...line,
		oldNumber: line.kind === "add" ? undefined : oldNumber++,
		newNumber: line.kind === "remove" ? undefined : newNumber++,
	}));
}

/** Pairs each run of removals with the additions that follow it, GitHub-style. */
function splitRows(hunk: DiffHunk): SplitRow[] {
	const rows: SplitRow[] = [];
	let removed: NumberedLine[] = [];
	let added: NumberedLine[] = [];
	const flush = () => {
		for (let i = 0; i < Math.max(removed.length, added.length); i++) {
			rows.push({ old: removed[i], new: added[i] });
		}
		removed = [];
		added = [];
	};
	for (const line of unifiedRows(hunk)) {
		if (line.kind === "remove") {
			removed.push({ ...line, number: line.oldNumber! });
		} else if (line.kind === "add") {
			added.push({ ...line, number: line.newNumber! });
		} else {
			flush();
			rows.push({
				old: { ...line, number: line.oldNumber! },
				new: { ...line, number: line.newNumber! },
			});
		}
	}
	flush();
	return rows;
}

function LineNumber({ value }: { value?: number }) {
	return (
		<span className="px-2 text-right text-muted select-none">{value}</span>
	);
}

function DiffCode({ line }: { line: DiffLine }) {
	return (
		<>
			<span className={`select-none ${signTone[line.kind]}`}>
				{lineSign[line.kind]}
			</span>
			<span className="pr-3 break-all whitespace-pre-wrap">
				{line.content}
			</span>
		</>
	);
}

function SplitCell({ line }: { line?: NumberedLine }) {
	return (
		<div
			className={`grid grid-cols-[3rem_1rem_1fr] ${line ? lineTone[line.kind] : "bg-surface-secondary"}`}
		>
			{line && (
				<>
					<LineNumber value={line.number} />
					<DiffCode line={line} />
				</>
			)}
		</div>
	);
}

export function CodeDiff({ node, context }: TemplateProps) {
	const { title, description, file, url, hunks } = node.data as {
		title: string;
		description: string;
		file: string;
		url?: string | null;
		hunks: DiffHunk[];
	};
	const [mode, setMode] = useState<Mode>("split");
	const storyRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [storyStep, setStoryStep] = useState(0);
	const scrollStory = title === "Session creation change";
	useEffect(() => {
		if (!scrollStory) return;
		let frame = 0;
		const update = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				const section = storyRef.current;
				const stage = stageRef.current;
				if (!section || !stage) return;
				const start =
					window.scrollY + section.getBoundingClientRect().top - 80;
				const distance = Math.max(
					1,
					section.offsetHeight - stage.offsetHeight,
				);
				const progress = Math.max(
					0,
					Math.min(1, (window.scrollY - start) / distance),
				);
				setStoryStep(
					progress < 0.12
						? 0
						: progress < 0.3
							? 1
							: progress < 0.34
								? 2
								: progress < 0.42
									? 3
									: progress < 0.82
										? 4
										: 5,
				);
			});
		};
		window.addEventListener("scroll", update, true);
		window.addEventListener("resize", update);
		update();
		return () => {
			window.removeEventListener("scroll", update, true);
			window.removeEventListener("resize", update);
			cancelAnimationFrame(frame);
		};
	}, [scrollStory]);
	const shownMode = scrollStory
		? storyStep < 3
			? "split"
			: "unified"
		: mode;
	const modeToggle = (
		<ToggleButtonGroup
			aria-label={
				scrollStory
					? "Diff layout, controlled by scrolling"
					: "Diff layout"
			}
			size="sm"
			selectionMode="single"
			disallowEmptySelection
			selectedKeys={[shownMode]}
			onSelectionChange={(keys) => {
				if (!scrollStory) setMode([...keys][0] as Mode);
			}}
			className="shrink-0"
		>
			<ToggleButton id="split">Split</ToggleButton>
			<ToggleButton id="unified">Unified</ToggleButton>
		</ToggleButtonGroup>
	);
	const lines = hunks.flatMap((hunk) => hunk.lines);
	const additions = lines.filter((line) => line.kind === "add").length;
	const removals = lines.filter((line) => line.kind === "remove").length;

	return (
		<BlockSection
			title={title}
			description={description}
			edit={{ node, context }}
			action={
				scrollStory ? undefined : (
					<div className="hidden sm:flex">{modeToggle}</div>
				)
			}
		>
			<div
				ref={storyRef}
				className={
					scrollStory
					? "h-[300vh] lg:-mx-72 lg:w-[calc(100%+36rem)]"
						: undefined
				}
			>
				<div
					ref={stageRef}
					className={
						scrollStory
							? "sticky top-20 grid h-[calc(100vh-6rem)] items-center gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_18rem]"
							: undefined
					}
				>
					{scrollStory && (
						<StoryNote
							placement="left"
							visible={storyStep === 1}
							title="Give Context to your Pull Requests."
							body="Integrate Klee into your GitHub, GitLab or BitBucket pipeline, so you can keep your team moving elegantly without any extra explanations."
						/>
					)}
					<Card
						className={`gap-0 overflow-hidden p-0 ${scrollStory ? "lg:col-start-2 lg:row-start-1" : ""}`}
					>
						<Card.Header className="flex-row items-center gap-2 border-b border-divider bg-surface-secondary px-4 py-2">
							<FileCode2
								size={15}
								className="shrink-0 text-muted"
							/>
							<Card.Title className="min-w-0 flex-1 truncate font-mono text-xs">
								{url?.startsWith("https://") ? (
									<a
										className="underline decoration-muted underline-offset-4 hover:text-primary"
										href={url}
									>
										{file}
									</a>
								) : (
									file
								)}
							</Card.Title>
							{additions > 0 && (
								<Chip size="sm" color="success">
									+{additions}
								</Chip>
							)}
							{removals > 0 && (
								<Chip size="sm" color="danger">
									-{removals}
								</Chip>
							)}
							{scrollStory && modeToggle}
						</Card.Header>
						<Card.Content className="gap-0 font-mono text-xs leading-5">
							{hunks.map((hunk) => (
								<div key={`${hunk.oldStart}-${hunk.newStart}`}>
									<Paragraph
										size="xs"
										color="muted"
										className="border-b border-divider bg-surface-secondary/60 px-4 py-1 font-mono"
									>
										{hunk.header}
									</Paragraph>
									<div className="hidden sm:grid [&>*]:col-start-1 [&>*]:row-start-1">
										<div
											className={`transition-all duration-500 ease-out ${shownMode === "split" ? "opacity-100" : "pointer-events-none translate-x-4 opacity-0"}`}
										>
											{splitRows(hunk).map(
												(row, index) => (
													<div
														key={index}
														className="grid grid-cols-2 divide-x divide-divider"
													>
														<SplitCell
															line={row.old}
														/>
														<SplitCell
															line={row.new}
														/>
													</div>
												),
											)}
										</div>
										<div
											className={`transition-all duration-500 ease-out ${shownMode === "unified" ? "opacity-100" : "pointer-events-none -translate-x-4 opacity-0"}`}
										>
											{unifiedRows(hunk).map(
												(line, index) => (
													<UnifiedLine
														key={index}
														line={line}
													/>
												),
											)}
										</div>
									</div>
									{/* Split view is too cramped on phones, so they always get unified. */}
									<div className="sm:hidden">
										{unifiedRows(hunk).map(
											(line, index) => (
												<UnifiedLine
													key={index}
													line={line}
												/>
											),
										)}
									</div>
								</div>
							))}
						</Card.Content>
					</Card>
					{scrollStory && (
						<StoryNote
							placement="right"
							visible={storyStep === 4}
							title="Share the whole story. Or just a task."
							body="Automatically share a contextual Klee artefact with anyone on your team, or manually provide one. The choice is yours."
						/>
					)}
				</div>
			</div>
		</BlockSection>
	);
}

function UnifiedLine({ line }: { line: UnifiedRow }) {
	return (
		<div
			className={`grid grid-cols-[3rem_3rem_1rem_1fr] ${lineTone[line.kind]}`}
		>
			<LineNumber value={line.oldNumber} />
			<LineNumber value={line.newNumber} />
			<DiffCode line={line} />
		</div>
	);
}

function StoryNote({
	placement,
	visible,
	title,
	body,
}: {
	placement: "left" | "right";
	visible: boolean;
	title: string;
	body: string;
}) {
	return (
		<div
			className={`relative z-10 hidden w-72 self-center lg:row-start-1 lg:block ${placement === "left" ? "lg:col-start-1 lg:translate-x-[46%] lg:-translate-y-[15%]" : "lg:col-start-3 lg:-translate-x-[46%] lg:translate-y-[15%]"}`}
		>
			<aside
				aria-hidden={!visible}
				className={`rounded-2xl border border-divider bg-surface-secondary p-6 shadow-2xl transition-all duration-500 ease-out ${visible ? "translate-x-0 translate-y-0 opacity-100" : "pointer-events-none translate-x-8 translate-y-3 opacity-0"}`}
			>
				<p className="mt-2 text-lg font-semibold leading-6">{title}</p>
				<p className="mt-3 text-base leading-7 text-muted">{body}</p>
			</aside>
		</div>
	);
}

CodeDiff.template = "code-diff" as const;
CodeDiff.info =
	"Code diff viewer for one file, with split and unified layouts. Pick it when the prompt includes or asks about concrete code changes; only use code the user supplied or that can be quoted from connected source, and keep hunks short.";
CodeDiff.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
