import {
	Card,
	Chip,
	Paragraph,
	ToggleButton,
	ToggleButtonGroup,
} from "@heroui/react";
import { FileCode2 } from "lucide-react";
import { useState } from "react";
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
	const lines = hunks.flatMap((hunk) => hunk.lines);
	const additions = lines.filter((line) => line.kind === "add").length;
	const removals = lines.filter((line) => line.kind === "remove").length;

	return (
		<BlockSection
			title={title}
			description={description}
			edit={{ node, context }}
			action={
				<ToggleButtonGroup
					aria-label="Diff layout"
					size="sm"
					selectionMode="single"
					disallowEmptySelection
					selectedKeys={[mode]}
					onSelectionChange={(keys) => setMode([...keys][0] as Mode)}
					className="hidden shrink-0 sm:flex"
				>
					<ToggleButton id="split">Split</ToggleButton>
					<ToggleButton id="unified">Unified</ToggleButton>
				</ToggleButtonGroup>
			}
		>
			<Card className="gap-0 overflow-hidden p-0">
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
							{mode === "split" && (
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
							<div className={mode === "split" ? "sm:hidden" : undefined}>
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
		</BlockSection>
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
