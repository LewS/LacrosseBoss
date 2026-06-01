"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/competitions", label: "Competitions" },
  { href: "/admin/divisions", label: "Divisions" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/account", label: "Account" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full">
      <nav className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
          <Link href="/" className="font-bold text-lg mr-4 shrink-0 py-3">🥍</Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-3 text-sm shrink-0 border-b-2 ${
                pathname === item.href
                  ? "border-blue-600 text-blue-600 font-medium"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
