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
	const [storyStage, setStoryStage] = useState(0);
	const scrollStory = title === "Session creation change";
	useEffect(() => {
		if (!scrollStory) return;
		const update = () => {
			const element = storyRef.current;
			if (!element) return;
			const progress = Math.max(0, Math.min(1, -element.getBoundingClientRect().top / Math.max(1, element.offsetHeight - window.innerHeight)));
			setStoryStage(progress < 0.5 ? 0 : 1);
		};
		window.addEventListener("scroll", update, true);
		update();
		return () => window.removeEventListener("scroll", update, true);
	}, [scrollStory]);
	const shownMode = scrollStory ? (storyStage === 0 ? "split" : "unified") : mode;
	const lines = hunks.flatMap((hunk) => hunk.lines);
	const additions = lines.filter((line) => line.kind === "add").length;
	const removals = lines.filter((line) => line.kind === "remove").length;

	return (
		<BlockSection
			title={title}
			description={description}
			edit={{ node, context }}
				action={scrollStory ? <Chip size="sm">Scroll to compare</Chip> : (
					<ToggleButtonGroup
					aria-label="Diff layout"
					size="sm"
					selectionMode="single"
					disallowEmptySelection
						selectedKeys={[shownMode]}
					onSelectionChange={(keys) => setMode([...keys][0] as Mode)}
					className="hidden shrink-0 sm:flex"
				>
					<ToggleButton id="split">Split</ToggleButton>
					<ToggleButton id="unified">Unified</ToggleButton>
					</ToggleButtonGroup>
				)}
			>
				<div ref={storyRef} className={scrollStory ? "h-[180vh]" : undefined}>
					<div className={scrollStory ? "sticky top-6 grid min-h-[min(42rem,calc(100vh-3rem))] items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" : undefined}>
						{scrollStory && <StoryNote side="left" visible={storyStage === 0} title="Split view: compare state" body="The old session key and in-memory assignment sit beside the replacement, making the storage boundary easy to inspect." />}
				<Card className={`gap-0 overflow-hidden p-0 ${scrollStory && storyStage === 1 ? "lg:order-first" : ""}`}>
				<Card.Header className="flex-row items-center gap-2 border-b border-divider bg-surface-secondary px-4 py-2">
					<FileCode2 size={15} className="shrink-0 text-muted" />
					<Card.Title className="min-w-0 flex-1 truncate font-mono text-xs">
						{url?.startsWith("https://") ? <a className="underline decoration-muted underline-offset-4 hover:text-primary" href={url}>{file}</a> : file}
					</Card.Title>
					{additions > 0 && <Chip size="sm" color="success">+{additions}</Chip>}
					{removals > 0 && <Chip size="sm" color="danger">-{removals}</Chip>}
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
							{shownMode === "split" && (
								<div className="hidden sm:block">
									{splitRows(hunk).map((row, index) => (
										<div
											key={index}
											className="grid grid-cols-2 divide-x divide-divider"
										>
											<SplitCell line={row.old} />
											<SplitCell line={row.new} />
										</div>
									))}
								</div>
							)}
							{/* Split view is too cramped on phones, so they always get unified. */}
							<div className={shownMode === "split" ? "sm:hidden" : undefined}>
								{unifiedRows(hunk).map((line, index) => (
									<div
										key={index}
										className={`grid grid-cols-[3rem_3rem_1rem_1fr] ${lineTone[line.kind]}`}
									>
										<LineNumber value={line.oldNumber} />
										<LineNumber value={line.newNumber} />
										<DiffCode line={line} />
									</div>
								))}
							</div>
						</div>
					))}
				</Card.Content>
					</Card>
						{scrollStory && <StoryNote side="right" visible={storyStage === 1} title="Unified view: follow the new path" body="A single timeline shows the stronger key and durable keyStore record together, including the session expiry." />}
					</div>
				</div>
			</BlockSection>
	);
}

function StoryNote({ side, visible, title, body }: { side: "left" | "right"; visible: boolean; title: string; body: string }) {
	return <aside className={`hidden transition-all duration-500 lg:block ${visible ? "translate-x-0 opacity-100" : `${side === "left" ? "-translate-x-6" : "translate-x-6"} opacity-0`}`}><p className="text-sm font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{body}</p><div className="mt-5 h-px w-12 bg-brand" /></aside>;
}

CodeDiff.template = "code-diff" as const;
CodeDiff.info =
	"Code diff viewer for one file, with split and unified layouts. Pick it when the prompt includes or asks about concrete code changes; only use code the user supplied or that can be quoted from connected source, and keep hunks short.";
CodeDiff.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
