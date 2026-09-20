"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Shield,
  UserRound,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AuthLayout } from "../../../login/AuthLayout";
import {
  authenticatedFetch,
  clearAccessToken,
  getTokenClaims,
  isTokenExpired,
} from "../../../Admin/auth";
import { Badge } from "../../../Admin/components/ui";
import { API_BASE_URL } from "../../../config";

type UserSummary = {
  emp_id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
};

type ActivityEvent = {
  event_type: "login" | "logout";
  occurred_at: string;
};

type ActivityResponse = {
  member_since: string | null;
  events: ActivityEvent[];
};

export default function AdminActivityPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const claims = getTokenClaims();
    if (
      !claims ||
      isTokenExpired(claims) ||
      claims.role?.toLowerCase() !== "admin"
    ) {
      clearAccessToken();
      router.replace("/Admin");
      return;
    }

    const userId = Number(params.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      const invalidIdTimer = window.setTimeout(
        () => setError("Invalid user ID."),
        0,
      );
      return () => window.clearTimeout(invalidIdTimer);
    }

    const loadActivity = async () => {
      try {
        const [userResponse, activityResponse] = await Promise.all([
          authenticatedFetch(`${API_BASE_URL}/users/${userId}`),
          authenticatedFetch(`${API_BASE_URL}/users/${userId}/activity`),
        ]);
        if (!userResponse.ok || !activityResponse.ok) {
          throw new Error("Could not load user activity.");
        }
        setUser(await userResponse.json());
        setActivity(await activityResponse.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load user activity.",
        );
      }
    };

    void loadActivity();
  }, [params.userId, router]);

  if (!user || !activity) {
    return (
      <AuthLayout
        eyebrow="Admin workspace"
        title="User activity"
        footer={
          <Link
            className="font-medium text-gray-900 hover:text-blue-600"
            href="/Admin"
          >
            <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Back to users
          </Link>
        }
      >
        <p
          className={
            error
              ? "rounded-md bg-red-50 p-3 text-sm text-red-700"
              : "text-sm text-gray-500"
          }
        >
          {error ?? "Loading activity..."}
        </p>
      </AuthLayout>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/Admin")}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to users
          </button>
          <Badge variant={user.is_active ? "success" : "default"}>
            {user.is_active ? "Active" : "Offline"}
          </Badge>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-slate-900 p-4 text-white">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  User activity
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  {user.name}
                </h1>
                <p className="text-sm text-slate-500">
                  {user.email} · {user.role}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              User ID{" "}
              <span className="font-mono font-semibold text-slate-900">
                #{user.emp_id}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-5">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Account activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Login and logout history for this user.
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-b border-slate-100 pb-5 text-sm text-slate-600">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Member since:{" "}
            {activity.member_since
              ? new Date(activity.member_since).toLocaleString()
              : "Not available"}
          </div>
          <div className="divide-y divide-slate-100">
            {activity.events.length ? (
              activity.events.map((event) => (
                <div
                  key={`${event.event_type}-${event.occurred_at}`}
                  className="flex items-center gap-4 py-5"
                >
                  <Shield className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900">
                      {event.event_type}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(event.occurred_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">
                No login history recorded.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
