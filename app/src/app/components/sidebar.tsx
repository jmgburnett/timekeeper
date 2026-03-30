"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";

const adminItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/entry", label: "Time Entry", icon: "✏️" },
  { href: "/customers", label: "Customers", icon: "🏢" },
  { href: "/capabilities", label: "Capabilities", icon: "⚙️" },
  { href: "/participants", label: "Participants", icon: "👥" },
  { href: "/settings", label: "Settings", icon: "🔧" },
];

const employeeItems = [
  { href: "/entry", label: "My Time", icon: "✏️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = user?.isAdmin ? adminItems : employeeItems;

  return (
    <aside className="w-56 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800">⏱ Timekeeper</h1>
        <p className="text-xs text-gray-500 mt-1">Weekly Time Tracking</p>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="px-3 mb-2">
            <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
            <p className="text-xs text-gray-400">
              {user.isAdmin ? "Admin" : "Employee"}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            ↩ Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
