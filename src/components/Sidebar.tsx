"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/",          emoji: "🌸", label: "Approval Form"     },
  { href: "/tracker",   emoji: "🎀", label: "Content Tracker"   },
  { href: "/analytics", emoji: "✨", label: "Analytics"         },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-cute-lg flex flex-col z-50">
      {/* Logo / Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500 flex items-center justify-center text-xl shadow-cute animate-float">
            🌸
          </div>
          <div>
            <p className="font-bold text-hotpink text-sm leading-tight font-quicksand">Bonvie</p>
            <p className="text-pink-400 text-xs">Affiliate Co-Pilot</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-6 flex flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200",
                active
                  ? "bg-pink-500 text-white shadow-cute"
                  : "text-pink-500 hover:bg-pink-50 hover:text-pink-600"
              )}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-white opacity-70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-pink-100">
        <p className="text-xs text-pink-300 text-center leading-relaxed">
          Made with 💕 by<br />
          <span className="font-semibold text-pink-400">adjisyahrul</span>
          <span className="text-pink-300"> to </span>
          <span className="font-semibold text-hotpink">iiaaa</span>
        </p>
      </div>
    </aside>
  );
}
