import {
  Bell,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { AdminView } from "../types";
import { getAvatarUrl } from "../avatar";

// Shared admin chrome: branding, navigation, header actions, and page content.
export function AdminShell({
  activeView,
  onViewChange,
  onLogout,
  adminName,
  children,
}: {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  onLogout: () => Promise<void>;
  adminName: string;
  children: React.ReactNode;
}) {
  // Keeping navigation data together makes adding another panel straightforward.
  const navigation = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="admin-shell relative flex h-screen w-full overflow-hidden bg-gray-50/70 font-sans text-gray-900">
      <div
        className="admin-ambient pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <aside className="relative z-10 hidden w-64 flex-col border-r border-gray-200 bg-white/95 sm:flex">
        <div className="flex h-14 items-center border-b border-gray-200 px-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <div className="rounded-md bg-gray-900 p-1.5">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Admin
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={`flex w-full items-center space-x-3 rounded-md px-3 py-2 transition-colors ${
                activeView === id
                  ? "bg-gray-100 font-medium text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 text-gray-400"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
            </button>
            <img
              src={getAvatarUrl(adminName)}
              alt={adminName}
              className="h-8 w-8 rounded-full border border-gray-200"
            />
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              {adminName}
            </span>
            <button
              onClick={() => void onLogout()}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
