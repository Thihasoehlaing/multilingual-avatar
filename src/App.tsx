import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import LandingPage from "./pages/Landing/LandingPage";

// Stubs for later pages (you can replace when ready)
const LoginPage = () => <div className="min-h-dvh bg-[--bg] text-[--fg] grid place-items-center">Login</div>;
const SignupPage = () => <div className="min-h-dvh bg-[--bg] text-[--fg] grid place-items-center">Signup</div>;
const ProfilePage = () => <div className="min-h-dvh bg-[--bg] text-[--fg] grid place-items-center">Account / Profile</div>;
const SpeakPage = () => <div className="min-h-dvh bg-[--bg] text-[--fg] grid place-items-center">Avatar Speak</div>;

function Shell() {
  const location = useLocation();
  const hideChrome = ["/login", "/signup"].includes(location.pathname); // hide navbar/footer on auth pages

  return (
    <div className="min-h-dvh bg-[--bg] text-[--fg] antialiased">
      {!hideChrome && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/avatar/speak" element={<SpeakPage />} />
          <Route path="*" element={<div className="p-10">Not found</div>} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
