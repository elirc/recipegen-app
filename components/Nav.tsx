"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Cook", icon: "🍳" },
  { href: "/history", label: "History", icon: "📖" },
  { href: "/favorites", label: "Favorites", icon: "⭐" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FFFBF5]">
        <Link href="/" className="text-xl font-bold text-orange-500 tracking-tight">
          weeknight
        </Link>
        <div className="flex gap-6">
          {LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
                  active ? "text-orange-500" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
        <div className="flex">
          {LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${
                  active ? "text-orange-500" : "text-stone-400"
                }`}
              >
                <span className="text-xl">{icon}</span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
