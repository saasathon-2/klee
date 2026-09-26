import { Button, Description, Dropdown, Label, Link } from "@heroui/react";
import { ChevronDown, Menu } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../lib/auth-client";
import { navMenus, pricingPath } from "../pages/landing/links";
import { KleeIcon } from "./KleeLogo";
import { ThemeToggle } from "./ThemeToggle";

const mobileLinks = [
	...navMenus.flatMap((menu) => menu.links),
	{ label: "Pricing", description: "Plans", to: pricingPath },
];

export function Navbar() {
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = (event: Event) => {
			const target = event.target;
			setScrolled(window.scrollY > 0 || (target instanceof HTMLElement && target.scrollTop > 0));
		};
		window.addEventListener("scroll", onScroll, true);
		return () => window.removeEventListener("scroll", onScroll, true);
	}, []);

	return (
		<header className={`sticky top-0 z-40 border-b bg-background transition-colors ${scrolled ? "border-border" : "border-transparent"}`}>
			<nav className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-6">
				<Link
					href="/welcome"
					aria-label="Klee home"
					className="justify-self-start"
				>
					<KleeIcon className="size-10" />
				</Link>

				<div className="hidden items-center gap-2 md:flex">
					{navMenus.map((menu) => (
						<Dropdown key={menu.label}>
							<Button
								variant="ghost"
								size="sm"
								className="gap-2 px-3 py-1.5"
							>
								{menu.label}
								<ChevronDown size={14} className="text-muted" />
							</Button>
							<Dropdown.Popover
								placement="bottom start"
								className="min-w-72"
							>
								<Dropdown.Menu
									aria-label={menu.label}
								>
									{menu.links.map((link) => (
										<Dropdown.Item
											key={link.label}
											id={link.label}
											textValue={link.label}
											render={(props) => (
												<a
													{...(props as unknown as ComponentProps<"a">)}
													href={link.to}
												/>
											)}
										>
											<div className="flex flex-col">
												<Label>{link.label}</Label>
												<Description>
													{link.description}
												</Description>
											</div>
										</Dropdown.Item>
									))}
								</Dropdown.Menu>
							</Dropdown.Popover>
						</Dropdown>
					))}
					<Button
						variant="ghost"
						size="sm"
						className="px-3 py-1.5"
						onPress={() => navigate(pricingPath)}
					>
						Pricing
					</Button>
				</div>

				<div className="col-start-3 flex items-center justify-self-end gap-3">
					<Dropdown>
						<Button
							isIconOnly
							aria-label="Open navigation"
							variant="ghost"
							className="md:hidden"
						>
							<Menu aria-hidden size={18} />
						</Button>
						<Dropdown.Popover placement="bottom end" className="min-w-72">
							<Dropdown.Menu aria-label="Navigation">
								{mobileLinks.map((link) => (
									<Dropdown.Item
										key={link.label}
										id={link.label}
										textValue={link.label}
										render={(props) => (
											<a
												{...(props as unknown as ComponentProps<"a">)}
												href={link.to}
											/>
										)}
									>
										<div className="flex flex-col">
											<Label>{link.label}</Label>
											<Description>{link.description}</Description>
										</div>
									</Dropdown.Item>
								))}
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
					<Button
						variant="ghost"
						size="sm"
						className="hidden md:flex"
						onPress={() => navigate("/docs")}
					>
						Docs
					</Button>
					{isPending ? null : session?.user ? (
						<Button size="sm" onPress={() => navigate("/")}>
							Dashboard
						</Button>
					) : (
						<Button size="sm" onPress={() => navigate("?auth=signin")}>
							Sign in
						</Button>
					)}
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
