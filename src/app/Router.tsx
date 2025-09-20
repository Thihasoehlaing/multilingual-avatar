import { BrowserRouter, Routes, Route, useLocation,Navigate } from "react-router-dom";
import ScrollToTop from "@/components/common/ScrollToTop";
import Footer from "@/components/layout/Footer";
import PublicNavbar from "@/components/layout/PublicNavbar";
import AppNavbar from "@/components/layout/AppNavbar";

import LandingPage from "@/pages/Landing/LandingPage";
import SignupPage from "@/pages/Auth/SignupPage";
import LoginPage from "@/pages/Auth/LoginPage";
import ProfilePage from "@/pages/Account/ProfilePage";
import SpeakPage from "@/pages/Avatar/SpeakPage";

import { ProtectedRoute } from "./ProtectedRoute";
import AdminLayout from "@/components/layout/AdminLayout";

import { useAppSelector } from "@/store/hooks";
import { selectAuth } from "@/store/auth.slice";

const APP_ROUTES = ["/account", "/avatar/speak"];

function Shell() {
  const { pathname } = useLocation();
  const { token } = useAppSelector(selectAuth);

  const hideChromeOnAuthScreens = pathname === "/login" || pathname === "/signup";
  const isApp = APP_ROUTES.some((p) => pathname.startsWith(p));

  // Navbar logic:
  // - None on auth screens
  // - PublicNavbar when not logged in (public pages)
  // - AppNavbar when logged in (public pages)
  const showNavbar = !hideChromeOnAuthScreens && !isApp;
  const showFooter = !isApp && !hideChromeOnAuthScreens;

  return (
    <div className="min-h-dvh bg-[--bg] text-[--fg] antialiased">
      {showNavbar && (token ? <AppNavbar /> : <PublicNavbar />)}

      <main>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              token ? <Navigate to="/account" replace /> : <LandingPage />
            }
          />

          {/* <Route path="/" element={<LandingPage />} /> */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Admin / Authed */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <ProfilePage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/avatar/speak"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <SpeakPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<div className="p-10">Not found</div>} />
        </Routes>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Shell />
    </BrowserRouter>
  );
}
