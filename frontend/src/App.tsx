import { RouterProvider } from "@heroui/react";
import {
	Navigate,
	Outlet,
	Route,
	Routes,
	useHref,
	useLocation,
	useNavigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthModal } from "./components/AuthModal";
import { Navbar } from "./components/Navbar";
import { PageLoader } from "./components/PageLoader";
import { Landing } from "./pages/Landing";
import { useSession } from "./lib/auth-client";

// Everything but the landing page loads on demand.
const Artefacts = lazy(() =>
	import("./pages/Artefacts").then((module) => ({
		default: module.Artefacts,
	})),
);
const Docs = lazy(() =>
	import("./pages/Docs").then((module) => ({ default: module.Docs })),
);
const MarketingPage = lazy(() =>
	import("./pages/MarketingPage").then((module) => ({
		default: module.MarketingPage,
	})),
);
const FormsExample = lazy(() =>
	import("./pages/FormsExample").then((module) => ({
		default: module.FormsExample,
	})),
);
const SocialExample = lazy(() =>
	import("./pages/SocialExample").then((module) => ({
		default: module.SocialExample,
	})),
);
const SettingsExample = lazy(() =>
	import("./pages/SettingsExample").then((module) => ({
		default: module.SettingsExample,
	})),
);
const Settings = lazy(() =>
	import("./pages/Settings").then((module) => ({ default: module.Settings })),
);

function RequireUser() {
	const { data: session, isPending } = useSession();
	if (isPending) return <PageLoader />;
	return session?.user ? <Outlet /> : <Navigate to="/?auth=signin" replace />;
}

function Home() {
	const { data: session, isPending } = useSession();
	if (window.location.hostname === "docs.klee.work") return <Docs />;
	if (isPending) return <PageLoader />;
	return session?.user ? <Artefacts /> : <Landing />;
}

function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: session, isPending } = useSession();
	const isWorkspace =
		location.pathname.startsWith("/artefacts") ||
		(["/", "/integrations", "/organisations"].includes(location.pathname) &&
			Boolean(session?.user));

	return (
		// Lets HeroUI links and menu items navigate with react-router.
		<RouterProvider navigate={navigate} useHref={useHref}>
			<div className="min-h-screen">
				{!isWorkspace && <Navbar />}
				<Suspense fallback={<PageLoader />}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/welcome" element={<Landing />} />
						<Route path="/docs" element={<Docs />} />
						<Route
							path="/create"
							element={<MarketingPage page="create" />}
						/>
						<Route
							path="/review"
							element={<MarketingPage page="review" />}
						/>
						<Route
							path="/share"
							element={<MarketingPage page="share" />}
						/>
						<Route
							path="/developers"
							element={<MarketingPage page="developers" />}
						/>
						<Route
							path="/developer-templates"
							element={
								<MarketingPage page="developer-templates" />
							}
						/>
						<Route
							path="/developer-integrations"
							element={
								<MarketingPage page="developer-integrations" />
							}
						/>
						<Route
							path="/business"
							element={<MarketingPage page="business" />}
						/>
						<Route
							path="/access-control"
							element={<MarketingPage page="access-control" />}
						/>
						<Route
							path="/team-integrations"
							element={<MarketingPage page="team-integrations" />}
						/>
						<Route
							path="/pricing"
							element={<MarketingPage page="pricing" />}
						/>
						{/* Sign-in lives in a modal now; keep the old links working. */}
						<Route
							path="/login"
							element={<Navigate to="/?auth=signin" replace />}
						/>
						<Route
							path="/register"
							element={<Navigate to="/?auth=signup" replace />}
						/>
						<Route element={<RequireUser />}>
							<Route path="/settings" element={<Settings />} />
							<Route
								path="/integrations"
								element={<Artefacts />}
							/>
							<Route
								path="/organisations"
								element={
									<Navigate
										to="/?panel=organisations"
										replace
									/>
								}
							/>
						</Route>
						<Route
							path="/artefacts"
							element={<Navigate to="/" replace />}
						/>
						<Route
							path="/artefacts/:id"
							element={<Navigate to="/" replace />}
						/>
						<Route
							path="/artefacts/shared/:shareId"
							element={<Artefacts />}
						/>
						<Route
							path="/artefacts/shared/:shareId/full"
							element={<Artefacts />}
						/>
						<Route
							path="/examples/forms"
							element={<FormsExample />}
						/>
						<Route
							path="/examples/social"
							element={<SocialExample />}
						/>
						<Route
							path="/examples/settings"
							element={<SettingsExample />}
						/>
						<Route
							path="*"
							element={<Navigate to="/welcome" replace />}
						/>
					</Routes>
				</Suspense>
				{!isPending && !session?.user && <AuthModal />}
			</div>
		</RouterProvider>
	);
}

export default App;
