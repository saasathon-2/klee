import {
	Check,
	Copy,
	GitBranch,
	GitCommitHorizontal,
	GitPullRequest,
} from "lucide-react";
import { Heading } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Scallop } from "../../artefacts/templates/page/Scallop";
import { GitHubIcon } from "../../components/BrandIcons";
import { KleeIcon } from "../../components/KleeLogo";
import { UserAvatar } from "../../components/UserAvatar";

const commits = [
	{ message: "chore: scaffold integration fixtures", sha: "7c32a61" },
	{ message: "docs: add context fixture notes", sha: "4f291ea" },
	{ message: "feat: include pull request metadata", sha: "b2012a4" },
	{ message: "test: add GitHub context fixtures", sha: "f344bbf" },
	{ message: "test: add code context fixtures", sha: "6aa9dd9" },
];
const pop = (visible: boolean) =>
	"transition-all duration-300 ease-out motion-reduce:transition-none " +
	(visible
		? "translate-y-0 scale-100 opacity-100"
		: "pointer-events-none translate-y-3 scale-95 opacity-0");

export function GitHubPullRequestStory() {
	const storyRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [step, setStep] = useState(0);
	const commitCount = Math.min(step, commits.length);
	const latestPassed = step >= commits.length + 2;
	const botVisible = step >= commits.length + 3;
	const replyVisible = step >= commits.length + 4;
	const visibleCommits = botVisible
		? commits.slice(-1)
		: commits.slice(0, commitCount);

	useEffect(() => {
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
				const next =
					progress < 0.106
						? 0
						: progress < 0.159
							? 1
							: progress < 0.212
								? 2
								: progress < 0.265
									? 3
									: progress < 0.318
										? 4
										: progress < 0.371
											? 5
											: progress < 0.424
												? 6
												: progress < 0.561
													? 7
													: progress < 0.773
														? 8
														: progress < 0.98
															? 9
															: 10;
				setStep(next);
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
	}, []);

	return (
		<div
			ref={storyRef}
			className="h-[calc(364vh-2rem)] px-3 py-8 sm:px-6 lg:px-10"
		>
			<div
				ref={stageRef}
				className="sticky top-20 flex h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-[clamp(1.25rem,5dvh,3.5rem)] py-[clamp(1rem,4dvh,3rem)]"
			>
				<Heading
					level={2}
					align="center"
					className="max-w-3xl shrink-0 px-4 text-heading-2 text-balance sm:[@media(min-height:44rem)]:text-heading-1"
				>
					<GitHubIcon aria-hidden className="mx-auto mb-3 size-7 sm:[@media(min-height:44rem)]:size-9" />
					Every pull request, explained
				</Heading>
				<section
					aria-label="GitHub pull request preview"
					inert
					className="flex min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-github-border bg-github-canvas text-github-foreground shadow-xl"
				>
					<header className="shrink-0 border-b border-github-border px-4 py-4 sm:px-8">
						<div className="flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-2 rounded-full bg-github-open px-4 py-2 text-sm font-semibold text-github-foreground-on-emphasis">
								<GitPullRequest aria-hidden size={17} />
								Open
							</span>
							<h2 className="min-w-0 flex-1 text-lg font-semibold sm:text-2xl">
								GitHub Context Fixtures{" "}
								<span className="font-normal text-github-muted">
									#42
								</span>
							</h2>
						</div>
						<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-github-muted sm:text-base">
							<span className="font-semibold text-github-foreground">
								winkingleek
							</span>
							wants to merge {commits.length} commits into
							<code className="rounded-md bg-github-canvas-subtle px-2 py-1 font-semibold text-github-link">
								main
							</code>
							from
							<code className="rounded-md bg-github-canvas-subtle px-2 py-1 font-semibold text-github-link">
								feat/github-context-fixtures
							</code>
							<Copy
								aria-hidden
								size={18}
								className="ml-1 text-github-muted"
							/>
						</div>
					</header>

					<div className="min-h-0 overflow-hidden px-4 py-4 sm:px-8 sm:py-6">
						<div className="relative ml-5 border-l border-github-border pl-7">
							<div className="relative -ml-[3.15rem] mb-3 flex items-center gap-3">
								<span className="grid size-9 place-items-center rounded-full border border-github-border bg-github-canvas-subtle text-github-muted">
									<GitBranch aria-hidden size={17} />
								</span>
								<div className="size-8 shrink-0 overflow-hidden rounded-full">
									<UserAvatar name="winkingleek" size="sm" />
								</div>
								<p className="text-sm text-github-muted sm:text-base">
									<strong className="text-github-foreground">
										winkingleek
									</strong>{" "}
									added {commits.length} commits{" "}
									<time>2 minutes ago</time>
								</p>
							</div>
							<div className="space-y-1 pb-2">
								{botVisible && (
									<p className="pb-1 text-xs text-github-muted">
										{commits.length} commits condensed into
										this review
									</p>
								)}
								{visibleCommits.map((commit) => (
									<div
										key={commit.sha}
										className="relative -ml-[2.85rem] flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-github-canvas-subtle"
									>
										<span className="grid size-7 shrink-0 place-items-center rounded-full border border-github-border bg-github-canvas text-github-muted">
											<GitCommitHorizontal
												aria-hidden
												size={15}
											/>
										</span>
										<div className="size-8 shrink-0 overflow-hidden rounded-full">
											<UserAvatar
												name="winkingleek"
												size="sm"
											/>
										</div>
										<span className="min-w-0 flex-1 truncate font-mono text-xs text-github-foreground-code sm:text-sm">
											{commit.message}
										</span>
										{commit.sha ===
											commits[commits.length - 1].sha && (
											<Check
												aria-hidden
												className={
													"size-5 text-github-success transition-all duration-300 motion-reduce:transition-none " +
													(latestPassed
														? "scale-100 opacity-100"
														: "scale-50 opacity-0")
												}
											/>
										)}
										<code className="shrink-0 font-mono text-xs text-github-muted underline underline-offset-4">
											{commit.sha}
										</code>
									</div>
								))}
							</div>
						</div>

						<div
							aria-hidden={!botVisible}
							inert={!botVisible}
							className={
								"relative mt-4 flex gap-3 sm:gap-4 " +
								pop(botVisible)
							}
						>
							<KleeIcon className="size-10 shrink-0 rounded-xl sm:size-[4.5rem] sm:rounded-2xl" />
							<article className="min-w-0 flex-1 overflow-hidden rounded-lg border border-github-border">
								<header className="flex flex-wrap items-baseline gap-x-2 border-b border-github-border bg-github-canvas-subtle px-4 py-3 sm:px-6">
									<strong className="text-sm sm:text-lg">
										orca-klee
									</strong>
									<span className="rounded-full border border-github-border px-2 py-0.5 text-xs text-github-muted">
										Bot
									</span>
									<span className="text-sm text-github-muted sm:text-base">
										commented 2 minutes ago
									</span>
								</header>
								<div
									aria-hidden={!replyVisible}
									inert={!replyVisible}
									className={
										"bg-github-canvas p-3 sm:p-6 " +
										pop(replyVisible)
									}
								>
									<div className="overflow-hidden rounded-md border border-github-border bg-preview-surface text-preview-foreground shadow-sm">
										<header className="bg-preview-brand px-4 py-5 text-center sm:px-10 sm:py-8">
											<h3 className="text-lg font-bold sm:text-2xl">
												PR #42: GitHub Context Fixtures
											</h3>
											<p className="mx-auto mt-2 max-w-3xl text-xs leading-5 text-preview-muted sm:text-base">
												Adds GitHub and code-context
												fixtures. A reviewer left an
												explicit verdict, and the
												pipeline and checks pass.
												Everything should be good to go.
											</p>
											<div className="mt-3 flex flex-wrap justify-center gap-1.5 text-2xs text-preview-muted-strong sm:text-xs">
												{[
													"backend",
													"integration",
													"PR #42",
													"fixtures",
												].map((tag) => (
													<span
														key={tag}
														className="rounded bg-preview-surface/70 px-1.5 py-0.5"
													>
														{tag}
													</span>
												))}
												<span className="px-1.5 py-0.5">
													Sep 25, 2026
												</span>
											</div>
										</header>
										<div className="[--brand:var(--preview-brand)]">
											<Scallop edge="bottom" />
										</div>
										<div className="p-4 sm:p-8">
											<div className="grid gap-2 sm:grid-cols-3">
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														Changes
													</p>
													<strong className="text-lg">
														+456 / -28
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														2 Implemented Fixtures
													</p>
												</div>
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														CI
													</p>
													<strong className="text-lg">
														5 passed
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														generate-artefact and 4
														others
													</p>
												</div>
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														Testing Line Percentage
													</p>
													<strong className="text-lg">
														62% of committed lines
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														were in test commits
													</p>
												</div>
											</div>
											<h4 className="mt-7 text-lg font-bold sm:text-2xl">
												Review overview
											</h4>
											<p className="mt-2 max-w-4xl text-xs leading-5 sm:text-base">
												The PR adds context fixtures for
												GitHub integration, purely
												backend focused, with some
												automated tests.
											</p>
											<h4 className="mt-6 text-base font-bold sm:text-xl">
												Architecture
											</h4>
											<div className="mt-3 rounded-md border border-preview-code-border bg-preview-code p-3 font-mono text-2xs leading-5 sm:text-xs">
												<p className="text-preview-subtle">
													github-context-fixtures/architecture.md
												</p>
												<p className="mt-2 bg-preview-diff-add px-2 text-preview-diff-add-foreground">
													+ 1. Receive an event.
												</p>
												<p className="bg-preview-diff-add px-2 text-preview-diff-add-foreground">
													+ 2. Validate its input.
												</p>
												<p className="bg-preview-diff-add px-2 text-preview-diff-add-foreground">
													+ 3. Produce a shared
													summary.
												</p>
											</div>
										</div>
									</div>
								</div>
							</article>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
