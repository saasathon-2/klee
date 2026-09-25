import {
	Check,
	Copy,
	ExternalLink,
	GitBranch,
	GitCommitHorizontal,
	GitPullRequest,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Scallop } from "../../artefacts/templates/page/Scallop";
import { UserAvatar } from "../../components/UserAvatar";

const shareUrl =
	"https://klee.work/artefacts/shared/29984434-6a04-490e-9d70-08cc214a6c22";
const commits = [
	{ message: "chore: scaffold integration fixtures", sha: "7c32a61" },
	{ message: "docs: add context fixture notes", sha: "4f291ea" },
	{ message: "feat: include pull request metadata", sha: "b2012a4" },
	{ message: "test: add GitHub context fixtures", sha: "f344bbf" },
	{ message: "test: add code context fixtures", sha: "6aa9dd9" },
];
const pop = (visible: boolean) =>
	"transition-all duration-500 ease-out motion-reduce:transition-none " +
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
					progress < 0.07
						? 0
						: progress < 0.105
							? 1
							: progress < 0.14
								? 2
								: progress < 0.175
									? 3
									: progress < 0.21
										? 4
										: progress < 0.245
											? 5
											: progress < 0.28
												? 6
												: progress < 0.37
													? 7
													: progress < 0.51
														? 8
														: progress < 0.66
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
			className="h-[260vh] px-3 py-8 sm:px-6 lg:-mx-72 lg:w-[calc(100%+36rem)] lg:px-10"
		>
			<div
				ref={stageRef}
				className="sticky top-20 grid h-[calc(100vh-6rem)] place-items-center"
			>
				<section
					aria-label="GitHub pull request preview"
					className="max-h-full w-full max-w-6xl overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] text-[#e6edf3] shadow-xl"
				>
					<header className="border-b border-[#30363d] px-4 py-4 sm:px-8">
						<div className="flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-2 rounded-full bg-[#238636] px-4 py-2 text-sm font-semibold text-white">
								<GitPullRequest aria-hidden size={17} />
								Open
							</span>
							<h2 className="min-w-0 flex-1 text-lg font-semibold sm:text-2xl">
								GitHub Context Fixtures{" "}
								<span className="font-normal text-[#8b949e]">
									#42
								</span>
							</h2>
						</div>
						<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#8b949e] sm:text-base">
							<span className="font-semibold text-[#e6edf3]">
								winkingleek
							</span>
							wants to merge {commits.length} commits into
							<code className="rounded-md bg-[#161b22] px-2 py-1 font-semibold text-[#58a6ff]">
								main
							</code>
							from
							<code className="rounded-md bg-[#161b22] px-2 py-1 font-semibold text-[#58a6ff]">
								feat/github-context-fixtures
							</code>
							<Copy
								aria-hidden
								size={18}
								className="ml-1 text-[#8b949e]"
							/>
						</div>
					</header>

					<div className="max-h-[calc(100vh-13rem)] overflow-hidden px-4 py-4 sm:px-8 sm:py-6">
						<div className="relative ml-5 border-l border-[#30363d] pl-7">
							<div className="relative -ml-[3.15rem] mb-3 flex items-center gap-3">
								<span className="grid size-9 place-items-center rounded-full border border-[#30363d] bg-[#161b22] text-[#8b949e]">
									<GitBranch aria-hidden size={17} />
								</span>
								<div className="size-8 shrink-0 overflow-hidden rounded-full">
									<UserAvatar name="winkingleek" size="sm" />
								</div>
								<p className="text-sm text-[#8b949e] sm:text-base">
									<strong className="text-[#e6edf3]">
										winkingleek
									</strong>{" "}
									added {commits.length} commits{" "}
									<time>5 hours ago</time>
								</p>
							</div>
							<div className="space-y-1 pb-2">
								{botVisible && (
									<p className="pb-1 text-xs text-[#8b949e]">
										{commits.length} commits condensed into
										this review
									</p>
								)}
								{visibleCommits.map((commit) => (
									<div
										key={commit.sha}
										className="relative -ml-[2.85rem] flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[#161b22]"
									>
										<span className="grid size-7 shrink-0 place-items-center rounded-full border border-[#30363d] bg-[#0d1117] text-[#8b949e]">
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
										<span className="min-w-0 flex-1 truncate font-mono text-xs text-[#c9d1d9] sm:text-sm">
											{commit.message}
										</span>
										{commit.sha ===
											commits[commits.length - 1].sha && (
											<Check
												aria-hidden
												className={
													"size-5 text-[#3fb950] transition-all duration-500 motion-reduce:transition-none " +
													(latestPassed
														? "scale-100 opacity-100"
														: "scale-50 opacity-0")
												}
											/>
										)}
										<code className="shrink-0 font-mono text-xs text-[#8b949e] underline underline-offset-4">
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
							<img
								src="/kleelogo.svg"
								alt="orca-klee profile picture"
								className="size-10 shrink-0 rounded-xl sm:size-[4.5rem] sm:rounded-2xl"
							/>
							<article className="min-w-0 flex-1 overflow-hidden rounded-lg border border-[#30363d]">
								<header className="flex flex-wrap items-baseline gap-x-2 border-b border-[#30363d] bg-[#161b22] px-4 py-3 sm:px-6">
									<strong className="text-sm sm:text-lg">
										orca-klee
									</strong>
									<span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#8b949e]">
										Bot
									</span>
									<span className="text-sm text-[#8b949e] sm:text-base">
										commented 2 minutes ago
									</span>
								</header>
								<div
									aria-hidden={!replyVisible}
									inert={!replyVisible}
									className={
										"bg-[#0d1117] p-3 sm:p-6 " +
										pop(replyVisible)
									}
								>
									<div className="overflow-hidden rounded-md border border-[#30363d] bg-white text-[#1f2328] shadow-sm">
										<header className="bg-[#fbf463] px-4 py-5 text-center sm:px-10 sm:py-8">
											<h3 className="text-lg font-bold sm:text-2xl">
												PR #42: GitHub Context Fixtures
											</h3>
											<p className="mx-auto mt-2 max-w-3xl text-xs leading-5 text-[#56505e] sm:text-base">
												Adds GitHub and code-context
												fixtures. A reviewer left an
												explicit verdict, and the
												pipeline and checks pass.
												Everything should be good to go.
											</p>
											<div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] text-[#4e4657] sm:text-xs">
												{[
													"backend",
													"integration",
													"PR #42",
													"fixtures",
												].map((tag) => (
													<span
														key={tag}
														className="rounded bg-white/70 px-1.5 py-0.5"
													>
														{tag}
													</span>
												))}
												<span className="px-1.5 py-0.5">
													Sep 25, 2026
												</span>
											</div>
										</header>
										<div
											style={
												{
													"--brand": "#fbf463",
												} as CSSProperties
											}
										>
											<Scallop edge="bottom" />
										</div>
										<div className="p-4 sm:p-8">
											<div className="grid gap-2 sm:grid-cols-3">
												<div className="rounded-md bg-[#ebe7e8] p-3">
													<p className="text-xs text-[#6e6870]">
														Changes
													</p>
													<strong className="text-lg">
														+456 / -28
													</strong>
													<p className="mt-1 text-xs text-[#6e6870]">
														2 Implemented Fixtures
													</p>
												</div>
												<div className="rounded-md bg-[#ebe7e8] p-3">
													<p className="text-xs text-[#6e6870]">
														CI
													</p>
													<strong className="text-lg">
														5 passed
													</strong>
													<p className="mt-1 text-xs text-[#6e6870]">
														generate-artefact and 4
														others
													</p>
												</div>
												<div className="rounded-md bg-[#ebe7e8] p-3">
													<p className="text-xs text-[#6e6870]">
														Review
													</p>
													<strong className="text-lg">
														LGTM
													</strong>
													<p className="mt-1 text-xs text-[#6e6870]">
														Reviewed by Jane
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
											<div className="mt-3 rounded-md border border-[#e5e2e4] bg-[#f4f1f2] p-3 font-mono text-[10px] leading-5 sm:text-xs">
												<p className="text-[#5f5962]">
													github-context-fixtures/architecture.md
												</p>
												<p className="mt-2 bg-[#edf7e8] px-2 text-[#357b3c]">
													+ 1. Receive an event.
												</p>
												<p className="bg-[#edf7e8] px-2 text-[#357b3c]">
													+ 2. Validate its input.
												</p>
												<p className="bg-[#edf7e8] px-2 text-[#357b3c]">
													+ 3. Produce a shared
													summary.
												</p>
											</div>
											<a
												className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0969da] hover:underline"
												href={shareUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												Open shareable artefact{" "}
												<ExternalLink
													aria-hidden
													size={15}
												/>
											</a>
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
