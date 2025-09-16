import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 bg-[--bg-alt] text-[--fg]">
      <div className="mx-auto max-w-7xl px-4 py-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div className="text-base font-semibold text-white">Multilingual Avatar</div>
          <p className="mt-3 text-sm opacity-75 max-w-sm">
            Voice-preserving translation with precise lip-sync. Built for demos and real-time communication.
          </p>
        </div>

        {/* Product Links */}
        <div className="text-sm">
          <div className="text-white font-medium">Product</div>
          <ul className="mt-3 space-y-2">
            <li><a href="/#features" className="hover:text-[--primary] transition">Features</a></li>
            <li><a href="/#how" className="hover:text-[--primary] transition">How it works</a></li>
            <li><a href="/#faq" className="hover:text-[--primary] transition">FAQ</a></li>
          </ul>
        </div>

        {/* Account Links */}
        <div className="text-sm">
          <div className="text-white font-medium">Account</div>
          <ul className="mt-3 space-y-2">
            <li><Link to="/login" className="hover:text-[--primary] transition">Login</Link></li>
            <li><Link to="/signup" className="hover:text-[--primary] transition">Signup</Link></li>
            <li><Link to="/account" className="hover:text-[--primary] transition">Profile</Link></li>
          </ul>
        </div>
      </div>

      {/* Divider + Copyright */}
      <div className="px-4">
        <div className="mx-auto max-w-7xl border-t border-[--border]/30 pt-6 pb-8 text-xs opacity-70 flex items-center justify-center">
          <span>Copyright © {new Date().getFullYear()} Multilingual Avatar. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
