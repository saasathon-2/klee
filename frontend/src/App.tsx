import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Profile } from "./pages/Profile";
import { FormsExample } from "./pages/FormsExample";
import { SocialExample } from "./pages/SocialExample";
import { SettingsExample } from "./pages/SettingsExample";

function App() {
	return (
		<div className="min-h-screen">
			<Navbar />
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/examples/forms" element={<FormsExample />} />
				<Route path="/examples/social" element={<SocialExample />} />
				<Route path="/examples/settings" element={<SettingsExample />} />
			</Routes>
		</div>
	);
}

export default App;
