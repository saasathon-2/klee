import { Button, Heading, Paragraph } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import houseOnTheWater from "../assets/klee-house-on-the-water.jpg";
import polyphony from "../assets/klee-polyphony.jpg";
import { useSession } from "../lib/auth-client";
import { useTheme } from "../lib/use-theme";
import { Scallop } from "../artefacts/templates/page/Scallop";
import { Footer } from "./landing/Footer";
import { HeroArtefact } from "./landing/HeroArtefact";

const paintings = {
	light: { src: houseOnTheWater, title: "House on the Water", year: undefined },
	dark: { src: polyphony, title: "Polyphony", year: 1932 },
};

export function Landing() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { theme } = useTheme();
	const painting = paintings[theme];
	const start = () => navigate(session?.user ? "/" : "/register");

	return (
		<main>
			<section className="mx-auto max-w-[108rem] px-6 pt-6">
				<div className="relative">
					{/* The painting stops short so the demo hangs off its bottom edge. */}
					<br /><br />

					<div className="absolute inset-x-0 top-0 h-[40rem] overflow-hidden rounded-3xl sm:h-[46rem]">
						<img
							src={painting.src}
							alt=""
							className={`absolute inset-0 size-full object-cover ${theme === "light" ? "opacity-80" : ""}`}
						/>
					</div>
					<div className="relative flex flex-col items-center gap-10 px-4 pt-16 sm:px-10 sm:pt-24">
						<div className="max-w-3xl text-center">
							<Heading level={1} align="center" className="text-4xl text-balance sm:text-6xl">
								Create beautiful, shareable diagrams effortlessly
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

			{/* Pulled up over the demo's bottom edge so the scallops cut across it and the page. */}
			<div aria-hidden className="relative z-10 -mt-10 mb-16">
				<Scallop edge="top" />
				<div className="h-16 bg-brand" />
			</div>
			<Footer />
		</main>
	);
}
