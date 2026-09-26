import { Button, Heading } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import houseOnTheWater from "../assets/klee-house-on-the-water.jpg";
import polyphony from "../assets/klee-polyphony.jpg";
import hexagon from "../assets/hexagon.svg";
import loop from "../assets/loop.svg";
import squiggle from "../assets/squiggle.svg";
import starTwo from "../assets/star-2.png";
import { useSession } from "../lib/auth-client";
import { useTheme } from "../lib/use-theme";
import { useDocumentTitle } from "../useDocumentTitle";
import { Footer } from "./landing/Footer";
import { GitHubPullRequestStory } from "./landing/GitHubPullRequestStory";
import { HeroArtefact } from "./landing/HeroArtefact";
import { useLiquidDrag } from "./landing/useLiquidDrag";
import { SlackChannelStory } from "./landing/SlackChannelStory";

const paintings = {
	light: {
		src: houseOnTheWater,
		title: "House on the Water",
		year: undefined,
	},
	dark: { src: polyphony, title: "Polyphony", year: 1932 },
};

/**
 * Shapes that carry on down both sides of the hero demo, below the ones at the
 * top. Their spacing grows with their order, so they crowd near the top and
 * thin out further down; sides and insets are picked by hand to look random.
 */
const drifters = [
	{ src: squiggle, side: "left", top: "5%", inset: "clamp(-3rem, 1vw, 2rem)", width: "clamp(10rem, 16vw, 16rem)", rotate: -10, duration: 8, delay: -2 },
	{ src: hexagon, side: "left", top: "6.9%", inset: "clamp(1rem, 7vw, 8rem)", width: "clamp(5rem, 8vw, 8rem)", rotate: 12, duration: 9, delay: -4 },
	{ src: loop, side: "right", top: "10.7%", inset: "clamp(-1rem, 3vw, 4rem)", width: "clamp(8rem, 12vw, 12rem)", rotate: 0, duration: 10, delay: -1 },
	{ src: starTwo, side: "left", top: "15.9%", inset: "clamp(-2rem, 2vw, 3rem)", width: "clamp(8rem, 12vw, 12rem)", rotate: -14, duration: 7, delay: -3 },
	{ src: hexagon, side: "right", top: "22.2%", inset: "clamp(0rem, 5vw, 6rem)", width: "clamp(7rem, 11vw, 11rem)", rotate: -8, duration: 9, delay: -5 },
	{ src: squiggle, side: "right", top: "29.6%", inset: "clamp(-3rem, 0vw, 1rem)", width: "clamp(10rem, 15vw, 15rem)", rotate: 160, duration: 8, delay: -2 },
	{ src: loop, side: "left", top: "38%", inset: "clamp(0rem, 4vw, 5rem)", width: "clamp(7rem, 11vw, 11rem)", rotate: 30, duration: 10, delay: -6 },
	{ src: starTwo, side: "right", top: "47.2%", inset: "clamp(1rem, 6vw, 7rem)", width: "clamp(6rem, 9vw, 9rem)", rotate: 20, duration: 7, delay: -3 },
	{ src: hexagon, side: "right", top: "57.3%", inset: "clamp(-2rem, 1vw, 2rem)", width: "clamp(6rem, 9vw, 9rem)", rotate: 0, duration: 9, delay: -1 },
	{ src: squiggle, side: "left", top: "68.1%", inset: "clamp(-2rem, 3vw, 4rem)", width: "clamp(9rem, 14vw, 14rem)", rotate: 8, duration: 8, delay: -4 },
	{ src: starTwo, side: "left", top: "79.7%", inset: "clamp(0rem, 6vw, 7rem)", width: "clamp(7rem, 10vw, 10rem)", rotate: -6, duration: 7, delay: -2 },
	{ src: loop, side: "right", top: "92%", inset: "clamp(-1rem, 2vw, 3rem)", width: "clamp(8rem, 12vw, 12rem)", rotate: -20, duration: 10, delay: -5 },
] as const;

function BauhausShapes() {
	const shapes = useRef<HTMLDivElement>(null);
	useLiquidDrag(shapes);
	return (
		<div ref={shapes} aria-hidden="true" className="bauhaus-shapes">
			<div className="bauhaus-arch" />
			<div className="bauhaus-bloom">
				<i />
				<i />
				<i />
				<i />
			</div>
			<img className="bauhaus-star" src={starTwo} alt="" />
			<div className="bauhaus-dot" />
			{drifters.map(({ src, side, top, inset, width, rotate, duration, delay }, index) => (
				<img
					key={index}
					className="bauhaus-drifter"
					src={src}
					alt=""
					draggable={false}
					style={{
						top,
						[side]: inset,
						width,
						rotate: `${rotate}deg`,
						animationDuration: `${duration}s`,
						animationDelay: `${delay}s`,
					}}
				/>
			))}
		</div>
	);
}

export function Landing() {
	useDocumentTitle("Klee");
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { theme } = useTheme();
	const start = () => navigate(session?.user ? "/" : "?auth=signup");

	return (
		<main>
			<section className="home-section mx-auto max-w-[108rem] px-6 pt-6">
				<div className="bauhaus-hero relative">
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
					<BauhausShapes />
					{/* Decorative shapes stay behind the interactive content. */}
					<div className="relative z-10 flex flex-col items-center gap-10 px-4 pt-16 sm:px-10 sm:pt-24">
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

			<SlackChannelStory />
			<GitHubPullRequestStory />

			<Footer />
		</main>
	);
}
