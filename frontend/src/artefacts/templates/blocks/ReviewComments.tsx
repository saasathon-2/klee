import { Alert, Avatar, Card, Chip } from "@heroui/react";
import type { ReviewComment } from "../../model";
import { BlockSection } from "../page/BlockSection";
import { editableFor } from "../page/editableFor";
import { initials } from "../page/initials";
import type { TemplateProps, TemplateSelectionInfo } from "../types";

const verdicts = {
	approved: { color: "success", label: "Approved" },
	"changes-requested": { color: "danger", label: "Changes requested" },
	commented: { color: "default", label: "Commented" },
} as const;

export function ReviewComments({ node, context }: TemplateProps) {
	const { title, summary, comments } = node.data as {
		title: string;
		summary: string;
		comments: ReviewComment[];
	};
	const text = editableFor(node, context);
	return (
		<BlockSection title={title} edit={{ node, context }}>
			<div className="grid gap-3 sm:grid-cols-2">
				{comments.map((comment, index) => {
					const verdict = verdicts[comment.verdict] ?? verdicts.commented;
					return (
						<Card key={`${comment.author}-${index}`} variant="secondary">
							<Card.Header className="flex-row items-center gap-3">
								<Avatar size="sm">
									{comment.avatarUrl?.startsWith("https://") && <Avatar.Image src={comment.avatarUrl} alt="" />}
									<Avatar.Fallback>
										{initials(comment.author)}
									</Avatar.Fallback>
								</Avatar>
								<Card.Title className="min-w-0 flex-1 truncate">
									{comment.url?.startsWith("https://") ? <a className="underline decoration-muted underline-offset-4 hover:text-primary" href={comment.url} target="_blank" rel="noreferrer">{comment.author}</a> : comment.author}
								</Card.Title>
								<Chip size="sm" color={verdict.color}>
									{verdict.label}
								</Chip>
							</Card.Header>
							<Card.Content>
								<Card.Description>
									{text(["comments", index, "body"], comment.body, "Comment", true)}
								</Card.Description>
							</Card.Content>
						</Card>
					);
				})}
			</div>
			<Alert className="mt-4">
				<Alert.Indicator />
				<Alert.Content>
					<Alert.Title>Consensus</Alert.Title>
					<Alert.Description>
						{text(["summary"], summary, "Consensus", true)}
					</Alert.Description>
				</Alert.Content>
			</Alert>
		</BlockSection>
	);
}

ReviewComments.template = "review-comments" as const;
ReviewComments.info =
	"Reviewer feedback shown as comments with each reviewer's verdict, followed by the overall consensus. Pick it when the prompt includes pull request reviews, code review threads, or team feedback on a change.";
ReviewComments.children = {
	min: 0,
	max: 0,
	allowed: [],
} satisfies TemplateSelectionInfo["children"];
