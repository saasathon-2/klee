import {
	ChevronDown,
	ExternalLink,
	MessageSquare,
	PanelsTopLeft,
	Plus,
	Star,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Scallop } from "../../artefacts/templates/page/Scallop";

const shareUrl =
	"https://klee.work/artefacts/shared/29984434-6a04-490e-9d70-08cc214a6c22";
const pop = (visible: boolean) =>
	`transition-all duration-500 ease-out motion-reduce:transition-none ${visible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-95 opacity-0"}`;

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
							? 1
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
				className="sticky top-20 grid h-[calc(100vh-6rem)] place-items-center"
			>
				<section
					aria-label="Slack channel preview"
					className="max-h-full w-full max-w-6xl overflow-hidden rounded-xl border border-[#393b40] bg-[#1b1d21] text-[#d1d2d3] shadow-xl"
					style={{
						fontFamily:
							"Slack-Lato, Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif",
					}}
				>
					<header className="flex h-16 items-center gap-4 px-5 sm:px-8">
						<Star
							aria-hidden
							size={23}
							className="shrink-0 text-[#b7b8bb]"
						/>
						<h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
							<span className="text-[#b7b8bb]">#</span>devops
						</h2>
					</header>
					<nav
						aria-label="Channel tabs"
						className="flex h-[3.25rem] items-stretch gap-2 border-b border-[#393b40] px-5 sm:px-8"
					>
						<button className="flex items-center gap-2 border-b-2 border-[#d6b7ed] px-3 font-semibold text-white">
							<MessageSquare
								aria-hidden
								size={19}
								fill="currentColor"
							/>
							Messages
						</button>
						<button className="hidden items-center gap-2 px-3 font-medium text-[#a4a6aa] sm:flex">
							<PanelsTopLeft aria-hidden size={19} />
							Add canvas
						</button>
						<button
							aria-label="Add channel tab"
							className="grid size-10 place-items-center self-center text-[#a4a6aa]"
						>
							<Plus aria-hidden size={23} />
						</button>
					</nav>

					<div className="max-h-[calc(100vh-14rem)] overflow-hidden">
						<div className="relative flex min-h-24 gap-4 px-4 py-4 sm:px-8">
							<div
								role="img"
								aria-label="Patrick Jane Profile Picture"
								aria-hidden={!userVisible}
								inert={!userVisible}
								className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-[#11adbd] text-3xl text-white sm:size-[4.5rem] ${pop(userVisible)}`}
							>
								P
							</div>
							<div
								aria-hidden={!messageVisible}
								inert={!messageVisible}
								className={`min-w-0 flex-1 ${pop(messageVisible)}`}
							>
								<div className="flex flex-wrap items-baseline gap-x-3">
									<p className="text-lg font-bold text-[#f4f4f5] sm:text-2xl">
										Patrick Jane
									</p>
									<time className="text-sm text-[#a4a6aa] sm:text-lg">
										9:41 AM
									</time>
								</div>
								<a
									className="mt-1 block break-all text-base text-[#36c5f0] hover:underline sm:text-xl lg:text-2xl"
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
							className={`flex gap-4 bg-[#23252a] px-4 py-4 sm:px-8 ${pop(botVisible)}`}
						>
							<img
								src="/kleelogo.svg"
								alt="klee (local) profile picture"
								className="size-14 shrink-0 rounded-2xl sm:size-[4.5rem]"
							/>
							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-baseline gap-x-3">
									<p className="text-lg font-bold text-[#f4f4f5] sm:text-2xl">
										klee
										<span className="ml-2 rounded bg-[#3b3d42] px-1.5 py-0.5 align-middle text-xs font-medium text-[#d1d2d3]">
											APP
										</span>
									</p>
									<time className="text-sm text-[#a4a6aa] sm:text-lg">
										9:41 AM
									</time>
								</div>
								<button className="mt-2 flex items-center gap-1 text-sm text-[#a4a6aa] sm:text-base">
									(95 kB)
									<ChevronDown
										aria-hidden
										size={16}
										className="text-[#36c5f0]"
									/>
								</button>

								<div
									aria-hidden={!artefactVisible}
									inert={!artefactVisible}
									className={`relative mt-5 max-w-5xl ${pop(artefactVisible)}`}
								>
									<div className="overflow-hidden rounded-2xl border border-[#d6d477] bg-white text-[#1e1e1e] shadow-lg">
										<header className="bg-[#fbf463] px-6 py-5 sm:px-12 sm:py-7">
											<h3 className="text-xl font-bold sm:text-2xl">
												Linking authentication API to
												backend
											</h3>
											<p className="mt-2 max-w-3xl text-xs leading-5 text-[#4c4b35] sm:text-sm">
												PR #482 routes authentication
												through the API gateway and
												stores expiring session keys.
											</p>
											<div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-[#393829] sm:text-xs">
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
											</div>
										</header>
										<Scallop edge="bottom" />
										<div className="px-6 py-6 sm:px-12 sm:py-8">
											<h4 className="text-lg font-bold">
												PR overview
											</h4>
											<p className="mt-2 max-w-4xl text-xs leading-5 sm:text-sm">
												Three reviewers approved the
												change. Session-key rotation
												remains the main follow-up
												before merge.
											</p>
											<div className="mt-5 rounded-lg border border-[#e5e5dc] bg-[#f5f5eb] p-3 font-mono text-[10px] leading-5 sm:text-xs">
												<p className="font-semibold">
													src/auth/session.ts
												</p>
												<p className="mt-2 bg-[#edf7e8] px-2 text-[#357b3c]">
													+ const key =
													crypto.randomBytes(32).toString("hex");
												</p>
												<p className="bg-[#edf7e8] px-2 text-[#357b3c]">
													{
														"+ await keyStore.put(key, { userId, expiresAt });"
													}
												</p>
											</div>
										</div>
									</div>
									<a
										className="mt-8 inline-flex items-center rounded-md border border-[#55575d] px-4 py-2 text-base font-semibold text-[#f4f4f5] hover:bg-[#2b2d31]"
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
