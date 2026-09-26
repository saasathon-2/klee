import { Button, Heading } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import houseOnTheWater from "../assets/klee-house-on-the-water.jpg";
import polyphony from "../assets/klee-polyphony.jpg";
import { useSession } from "../lib/auth-client";
import { useTheme } from "../lib/use-theme";
import { useDocumentTitle } from "../useDocumentTitle";
import { GlueBand } from "../artefacts/templates/blocks/Glue";
import { Footer } from "./landing/Footer";
import { GitHubPullRequestStory } from "./landing/GitHubPullRequestStory";
import { HeroArtefact } from "./landing/HeroArtefact";
import { SlackChannelStory } from "./landing/SlackChannelStory";

const paintings = {
	light: {
		src: houseOnTheWater,
		title: "House on the Water",
		year: undefined,
	},
	dark: { src: polyphony, title: "Polyphony", year: 1932 },
};

/** Space between the hero demo and the stories, and the stories and the footer. */
const sectionGap = "mt-[clamp(4rem,12dvh,9rem)]";

export function Landing() {
	useDocumentTitle("Klee");
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { theme } = useTheme();
	const start = () => navigate(session?.user ? "/" : "?auth=signup");

	return (
		<main>
			<section className="home-section mx-auto max-w-[108rem] px-6 pt-6">
				<div className="relative">
					{/* The painting stops short so the demo hangs off its bottom edge. */}
					<br />
					<br />

					<div className="absolute inset-x-0 top-0 h-[54rem] overflow-hidden rounded-3xl sm:h-[54rem]">
						{/* Both paintings stay mounted so switching theme is instant; the
						 * hidden one loads at low priority after the visible one. */}
						{(["light", "dark"] as const).map((mode) => (
							<img
								key={mode}
								src={paintings[mode].src}
								alt=""
								fetchPriority={mode === theme ? "high" : "low"}
								className={`absolute inset-0 size-full object-cover ${mode !== theme ? "opacity-0" : mode === "light" ? "opacity-60" : "opacity-80"}`}
							/>
						))}
					</div>
					<div className="relative flex flex-col items-center gap-10 px-4 pt-16 sm:px-10 sm:pt-24">
						<div className="max-w-3xl text-center">
							<Heading
								level={1}
								align="center"
								className="text-4xl text-balance sm:text-6xl"
							>
								Create beautiful, shareable diagrams
								effortlessly
							</Heading>
							<div className="mt-8 flex flex-wrap justify-center gap-3">
								<Button size="lg" onPress={start}>
									Start creating
									<ArrowRight size={18} />
								</Button>
							</div>
						</div>
						<div className="w-full lg:w-3/5">
							<HeroArtefact />
						</div>
					</div>
				</div>
			</section>

			<div className={sectionGap}>
				<GlueBand>The same context, shared with your team</GlueBand>
			</div>
			<SlackChannelStory />
			<GitHubPullRequestStory />

			<Footer />
		</main>
	);
}
