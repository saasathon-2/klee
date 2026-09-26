import { Avatar, Card, Code, Paragraph, Separator } from "@heroui/react";
import { Fragment } from "react";
import type { Commit } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import { initials } from "../page/initials";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function CommitList({ node, context }: TemplateProps) {
	const { title, description, commits } = node.data as {
		title: string;
		description: string;
		commits: Commit[];
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} description={description} edit={{ node, context }}>
			<Card className="gap-0 p-0">
				{commits.map((commit, index) => (
					<Fragment key={`${commit.sha}-${index}`}>
						{index > 0 && <Separator />}
						<div className="flex items-start gap-3 px-4 py-3">
							<Avatar size="sm" className="shrink-0">
								{commit.avatarUrl?.startsWith("https://") && <Avatar.Image src={commit.avatarUrl} alt="" />}
								<Avatar.Fallback>{initials(commit.author)}</Avatar.Fallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<Paragraph size="sm" weight="medium">
									{commit.url?.startsWith("https://") ? <a className="underline decoration-muted underline-offset-4 hover:text-accent-text" href={commit.url} target="_blank" rel="noreferrer">{text(["commits", index, "message"], commit.message, "Commit message")}</a> : text(["commits", index, "message"], commit.message, "Commit message")}
								</Paragraph>
								<Paragraph size="xs" color="muted">
									{commit.author}
								</Paragraph>
								<Paragraph size="sm" color="muted" className="mt-1">
									{text(["commits", index, "detail"], commit.detail, "Commit detail", true)}
								</Paragraph>
							</div>
							{commit.sha && (
								commit.url?.startsWith("https://") ? <a href={commit.url} target="_blank" rel="noreferrer"><Code className="shrink-0 text-xs">{commit.sha.slice(0, 7)}</Code></a> : <Code className="shrink-0 text-xs">{commit.sha.slice(0, 7)}</Code>
							)}
						</div>
					</Fragment>
				))}
			</Card>
		</BlockSection>
	);
}

CommitList.template = "commit-list" as const;
CommitList.info =
	"Chronological list of commits with message, author, and what each one changed. Pick it when the prompt lists commits or asks what was contributed to a branch or pull request.";
CommitList.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
