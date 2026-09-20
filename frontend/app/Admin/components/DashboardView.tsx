import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  UserRoundX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Display one high-level metric from the user collection.
// Reusable KPI card for the main dashboard metrics.
function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Visualizes a user count as a percentage of the total user population.
function ProgressRow({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {value} of {total} users
      </p>
    </div>
  );
}

// Presents read-only statistics derived from the backend user collection.
export function DashboardView({
  isLoading,
  error,
  total,
  active,
  offline,
}: {
  isLoading: boolean;
  error: string | null;
  total: number;
  active: number;
  offline: number;
}) {
  // These values are calculated from the counts supplied by the page coordinator.
  const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;
  const hasUsers = total > 0;
  const connectionStatus = isLoading
    ? "checking"
    : error
      ? "offline"
      : "online";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Overview heading and live backend connection state. */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-600">Workspace health</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            Dashboard Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            A clear view of your team and account activity.
          </p>
        </div>
        <div
          className={`inline-flex w-fit items-center
            gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${connectionStatus === "online" ? "bg-emerald-50 text-emerald-700" : connectionStatus === "offline" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${connectionStatus === "online" ? "bg-emerald-500" : connectionStatus === "offline" ? "bg-red-500" : "animate-pulse bg-gray-400"}`}
          />
          {connectionStatus === "online"
            ? "Backend online"
            : connectionStatus === "offline"
              ? "Backend offline"
              : "Checking backend"}
        </div>
      </div>

      {/* Primary workspace KPIs. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Registered"
          value={isLoading ? "-" : total}
          detail="All team accounts"
          icon={Users}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Users"
          value={isLoading ? "-" : active}
          detail={
            isLoading ? "Calculating activity" : `${activeRate}% of your team`
          }
          icon={Activity}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Offline Users"
          value={isLoading ? "-" : offline}
          detail="Currently inactive"
          icon={UserRoundX}
          colorClass="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Detailed activity breakdown and operational summary. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">User activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Current account availability across the workspace.
              </p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <div className="space-y-6">
              <ProgressRow
                label="Active accounts"
                value={active}
                total={total}
                colorClass="bg-emerald-500"
              />
              <ProgressRow
                label="Offline accounts"
                value={offline}
                total={total}
                colorClass="bg-amber-400"
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900">Workspace summary</h3>
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Availability rate
                </p>
                <p className="text-xs text-gray-500">
                  {isLoading
                    ? "Loading..."
                    : `${activeRate}% of accounts are active`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Account coverage
                </p>
                <p className="text-xs text-gray-500">
                  {isLoading
                    ? "Loading..."
                    : hasUsers
                      ? "User records are available"
                      : "No user records found"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <ArrowUpRight className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Next action</p>
                <p className="text-xs text-gray-500">
                  Review users from the Users panel
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
