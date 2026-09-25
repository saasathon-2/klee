import { Avatar, Card, Code, Separator } from "@heroui/react";
import { Fragment } from "react";
import type { Commit } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { initials } from "../page/initials";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

export function CommitList({ node }: TemplateProps) {
	const { title, description, commits } = node.data as {
		title: string;
		description: string;
		commits: Commit[];
	};
	return (
		<BlockSection title={title} description={description}>
			<Card className="gap-0 p-0">
				{commits.map((commit, index) => (
					<Fragment key={`${commit.sha}-${index}`}>
						{index > 0 && <Separator />}
						<div className="flex items-start gap-3 px-4 py-3">
							<Avatar size="sm" className="shrink-0">
								<Avatar.Fallback>{initials(commit.author)}</Avatar.Fallback>
							</Avatar>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">{commit.message}</p>
								<p className="text-xs text-muted">{commit.author}</p>
								<p className="mt-1 text-sm leading-6 text-muted">
									{commit.detail}
								</p>
							</div>
							{commit.sha && (
								<Code className="shrink-0 text-xs">
									{commit.sha.slice(0, 7)}
								</Code>
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
