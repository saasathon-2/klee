import {
	ChevronDown,
	ExternalLink,
	MessageSquare,
	Plus,
	Star,
} from "lucide-react";
import { Heading } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Scallop } from "../../artefacts/templates/page/Scallop";

const shareUrl =
	"https://klee.work/artefacts/shared/29984434-6a04-490e-9d70-08cc214a6c22";
const pop = (visible: boolean) =>
	`transition-all duration-300 ease-out motion-reduce:transition-none ${visible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-95 opacity-0"}`;

export function SlackChannelStory() {
	const storyRef = useRef<HTMLDivElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [step, setStep] = useState(0);
	const userVisible = step >= 1;
	const messageVisible = step >= 2;
	const botVisible = step >= 3;
	const artefactVisible = step >= 4;

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
				setStep(
					progress < 0.14
						? 0
						: progress < 0.3
							? 2
							: progress < 0.46
								? 2
								: progress < 0.62
									? 3
									: 4,
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
	}, []);

	return (
		<div ref={storyRef} className="h-[240vh] px-3 py-8 sm:px-6 lg:px-10">
			<div
				ref={stageRef}
				className="sticky top-20 flex h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-[clamp(1.25rem,5dvh,3.5rem)] py-[clamp(1rem,4dvh,3rem)]"
			>
				<Heading
					level={2}
					align="center"
					className="max-w-3xl shrink-0 px-4 text-heading-2 text-balance sm:[@media(min-height:44rem)]:text-heading-1"
				>
					Get up to speed without leaving the channel
				</Heading>
				<section
					aria-label="Slack channel preview"
					className="flex min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slack-border bg-slack-canvas font-slack text-slack-foreground shadow-xl"
				>
					<header className="flex h-16 shrink-0 items-center gap-4 px-5 sm:px-8">
						<Star
							aria-hidden
							size={23}
							className="shrink-0 text-slack-icon"
						/>
						<h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
							<span className="text-slack-icon">#</span>devops
						</h2>
					</header>
					<nav
						aria-label="Channel tabs"
						className="flex h-[3.25rem] shrink-0 items-stretch gap-2 border-b border-slack-border px-5 sm:px-8"
					>
						<button className="flex items-center gap-2 border-b-2 border-slack-tab-active px-3 font-semibold text-white">
							<MessageSquare
								aria-hidden
								size={19}
								fill="currentColor"
							/>
							Messages
						</button>
						<button
							aria-label="Add channel tab"
							className="grid size-10 place-items-center self-center text-slack-muted"
						>
							<Plus aria-hidden size={23} />
						</button>
					</nav>

					<div className="min-h-0 overflow-hidden">
						<div className="relative flex min-h-24 gap-4 px-4 py-4 sm:px-8">
							<div
								role="img"
								aria-label="Patrick Jane Profile Picture"
								aria-hidden={!userVisible}
								inert={!userVisible}
								className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-slack-avatar text-3xl text-white sm:size-[4.5rem] ${pop(userVisible)}`}
							>
								P
							</div>
							<div
								aria-hidden={!messageVisible}
								inert={!messageVisible}
								className={`min-w-0 flex-1 ${pop(messageVisible)}`}
							>
								<div className="flex flex-wrap items-baseline gap-x-3">
									<p className="text-lg font-bold text-slack-foreground-strong sm:text-2xl">
										Patrick Jane
									</p>
									<time className="text-sm text-slack-muted sm:text-lg">
										9:41 AM
									</time>
								</div>
								<a
									className="mt-1 block break-all text-base text-slack-link hover:underline sm:text-xl lg:text-2xl"
									href={shareUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									{shareUrl}
								</a>
							</div>
						</div>

						<div
							aria-hidden={!botVisible}
							inert={!botVisible}
							className={`flex gap-4 bg-slack-canvas-highlight px-4 py-4 sm:px-8 ${pop(botVisible)}`}
						>
							<img
								src="/kleelogo.svg"
								alt="klee (local) profile picture"
								className="size-14 shrink-0 rounded-2xl sm:size-[4.5rem]"
							/>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-baseline gap-x-3">
									<p className="text-lg font-bold text-slack-foreground-strong sm:text-2xl">
										klee
										<span className="ml-2 rounded bg-slack-badge px-1.5 py-0.5 align-middle text-xs font-medium text-slack-foreground">
											APP
										</span>
									</p>
									<time className="text-sm text-slack-muted sm:text-lg">
										9:41 AM
									</time>
								</div>
								<button className="mt-2 flex items-center gap-1 text-sm text-slack-muted sm:text-base">
									(95 kB)
									<ChevronDown
										aria-hidden
										size={16}
										className="text-slack-link"
									/>
								</button>

								<div
									aria-hidden={!artefactVisible}
									inert={!artefactVisible}
									className={`relative mt-5 max-w-5xl ${pop(artefactVisible)}`}
								>
									<div
										className="overflow-hidden rounded-md border border-github-border bg-preview-surface font-sans text-preview-foreground shadow-sm"
									>
										<header className="bg-preview-brand px-4 py-5 text-center sm:px-10 sm:py-8">
											<h3 className="text-lg font-bold sm:text-2xl">
												Linking authentication API to
												backend
											</h3>
											<p className="mx-auto mt-2 max-w-3xl text-xs leading-5 text-preview-muted sm:text-base">
												PR #482 routes authentication
												through the API gateway and
												stores expiring session keys.
											</p>
											<div className="mt-3 flex flex-wrap justify-center gap-1.5 text-2xs text-preview-muted-strong sm:text-xs">
												{[
													"saasathon-2/app",
													"PR #482",
													"authentication",
													"CI passed",
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
											style={{ "--brand": "var(--preview-brand)" } as CSSProperties}
										>
											<Scallop edge="bottom" />
										</div>
										<div className="p-4 sm:p-8">
											<div className="grid gap-2 sm:grid-cols-3">
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														Changes
													</p>
													<strong className="text-lg">
														+2 / -0
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														Session flow updated
													</p>
												</div>
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														CI
													</p>
													<strong className="text-lg">
														4 passed
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														All required checks
													</p>
												</div>
												<div className="rounded-md bg-preview-tile p-3">
													<p className="text-xs text-preview-tile-muted">
														Review
													</p>
													<strong className="text-lg">
														Approved
													</strong>
													<p className="mt-1 text-xs text-preview-tile-muted">
														Rotation follow-up noted
													</p>
												</div>
											</div>
											<h4 className="mt-7 text-lg font-bold sm:text-2xl">
												PR overview
											</h4>
											<p className="mt-2 max-w-4xl text-xs leading-5 sm:text-base">
												Three reviewers approved the
												change. Session-key rotation
												remains the main follow-up
												before merge.
											</p>
											<h4 className="mt-6 text-base font-bold sm:text-xl">
												Session creation change
											</h4>
											<div className="mt-3 rounded-md border border-preview-code-border bg-preview-code p-3 font-mono text-2xs leading-5 sm:text-xs">
												<p className="font-semibold">
													src/auth/session.ts
												</p>
												<p className="mt-2 bg-preview-diff-add px-2 text-preview-diff-add-foreground">
													+ const key =
													crypto.randomBytes(32).toString("hex");
												</p>
												<p className="bg-preview-diff-add px-2 text-preview-diff-add-foreground">
													{
														"+ await keyStore.put(key, { userId, expiresAt });"
													}
												</p>
											</div>
										</div>
									</div>
									<a
										className="mt-8 inline-flex items-center rounded-md border border-slack-border-strong px-4 py-2 text-base font-semibold text-slack-foreground-strong hover:bg-slack-hover"
										href={shareUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										Open in browser{" "}
										<ExternalLink
											aria-hidden
											size={17}
											className="ml-2"
										/>
									</a>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
