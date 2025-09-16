import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/Landing/LandingPage";
// (LoginPage, SignupPage, ProfilePage, SpeakPage will come later)

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/signup" element={<SignupPage />} /> */}
        {/* <Route path="/account" element={<ProfilePage />} /> */}
        {/* <Route path="/avatar/speak" element={<SpeakPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
