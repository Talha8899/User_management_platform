"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Activity,
  Badge as BadgeIcon,
  Check,
  Edit3,
  LogOut,
  Mail,
  MapPin,
  Shield,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../login/AuthLayout";
import {
  authHeaders,
  authenticatedFetch,
  clearAccessToken,
  getTokenClaims,
  isTokenExpired,
  refreshAccessToken,
} from "../Admin/auth";
import { Badge, Button, Input } from "../Admin/components/ui";

import { API_BASE_URL } from "../config";

// Profile shape returned by GET /users/me.
type UserProfile = {
  emp_id: number;
  name: string;
  address: string;
  email: string;
  role: string;
  is_active: boolean;
  last_seen_at: string | null;
};

type ActivityEvent = { event_type: "login" | "logout"; occurred_at: string };
type ActivityResponse = {
  member_since: string | null;
  events: ActivityEvent[];
};

type ProfileFormData = {
  name: string;
  email: string;
  address: string;
  password: string;
};

type ProfileTab = "profile" | "activity";

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    address: "",
    password: "",
  });
  const [activity, setActivity] = useState<ActivityResponse>({
    member_since: null,
    events: [],
  });

  useEffect(() => {
    // Reject missing or expired tokens before making a protected request.
    const claims = getTokenClaims();
    const loadProfile = async () => {
      try {
        if (
          !claims ||
          (isTokenExpired(claims) && !(await refreshAccessToken()))
        ) {
          clearAccessToken();
          router.replace("/login");
          return;
        }
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        if (!response.ok) {
          throw new Error("Could not load your profile.");
        }
        const loadedProfile: UserProfile = await response.json();
        setProfile(loadedProfile);
        setFormData({
          name: loadedProfile.name,
          email: loadedProfile.email,
          address: loadedProfile.address,
          password: "",
        });
        const activityResponse = await authenticatedFetch(
          `${API_BASE_URL}/users/me/activity`,
        );
        if (activityResponse.ok) setActivity(await activityResponse.json());
      } catch (profileError) {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Could not load your profile.",
        );
      }
    };

    void loadProfile();
  }, [router]);

  const handleLogout = async () => {
    // Tell the backend to clear presence before removing the local token.
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
      });
    } finally {
      clearAccessToken();
      router.replace("/login");
    }
  };

  const openEditor = () => {
    if (!profile) return;
    setFormData({
      name: profile.name,
      email: profile.email,
      address: profile.address,
      password: "",
    });
    setSaveMessage(null);
    setSaveError(null);
    setIsEditing(true);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/users/update/me`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            address: formData.address,
            ...(formData.password ? { password: formData.password } : {}),
          }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = Array.isArray(result?.detail)
          ? result.detail
              .map((item: { msg?: string }) => item.msg ?? "Validation error")
              .join("; ")
          : result?.detail;
        throw new Error(detail ?? "Could not update your profile.");
      }

      if (formData.password) {
        await handleLogout();
        return;
      }

      setProfile((currentProfile) =>
        currentProfile
          ? {
              ...currentProfile,
              name: formData.name,
              email: formData.email,
              address: formData.address,
            }
          : currentProfile,
      );
      setIsEditing(false);
      setSaveMessage(result?.message ?? "Profile updated successfully.");
    } catch (saveProfileError) {
      setSaveError(
        saveProfileError instanceof Error
          ? saveProfileError.message
          : "Could not update your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <AuthLayout
        eyebrow="Your workspace"
        title={error ? "Profile unavailable" : "Loading your profile"}
        footer={
          <Link
            className="font-medium text-gray-900 hover:text-blue-600"
            href="/login"
          >
            Return to sign in <ArrowRight className="inline h-3.5 w-3.5" />
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
          {error ?? "Checking your account details..."}
        </p>
      </AuthLayout>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
            <div className="rounded-lg bg-slate-900 p-2 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">User portal</p>
              <p className="text-xs text-slate-400">Secure workspace</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "profile" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <UserRound className="h-4 w-4" /> My profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium ${activeTab === "activity" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Activity className="h-4 w-4" /> Account activity
            </button>
          </nav>
          <button
            onClick={() => void handleLogout()}
            className="m-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Workspace
              </p>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Account overview
              </h1>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 lg:hidden"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </header>

          <div className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white shadow-sm sm:h-24 sm:w-24 sm:text-3xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="pb-1">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Profile
                      </p>
                      <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                        {profile.name}
                      </h2>
                      <p className="text-sm text-slate-500">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <Badge variant={profile.is_active ? "success" : "default"}>
                      {profile.is_active ? "Active" : "Offline"}
                    </Badge>
                    <Badge variant="secondary">{profile.role}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {saveMessage && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                {saveMessage}
              </p>
            )}
            {saveError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {saveError}
              </p>
            )}
            {activeTab === "profile" ? (
              <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                          Overview
                        </p>
                        <h3 className="mt-1 text-lg font-bold">
                          Personal details
                        </h3>
                      </div>
                      <BadgeIcon className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                        <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">
                            Email address
                          </p>
                          <p className="mt-1 text-sm font-medium">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
                        <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Address</p>
                          <p className="mt-1 text-sm font-medium">
                            {profile.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Role</p>
                          <p className="mt-1 text-sm font-medium capitalize">
                            {profile.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                        <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Member since</p>
                          <p className="mt-1 text-sm font-medium">
                            {activity.member_since
                              ? new Date(
                                  activity.member_since,
                                ).toLocaleDateString()
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        Account settings
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        Personal information
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep your profile details current.
                      </p>
                    </div>
                    {!isEditing && (
                      <Button onClick={openEditor} icon={Edit3}>
                        Edit profile
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={saveProfile} className="space-y-5">
                      <Input
                        id="profile-name"
                        label="Full name"
                        required
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({ ...formData, name: event.target.value })
                        }
                        disabled={isSaving}
                      />
                      <Input
                        id="profile-email"
                        label="Email address"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            email: event.target.value,
                          })
                        }
                        disabled={isSaving}
                      />
                      <Input
                        id="profile-address"
                        label="Address"
                        required
                        value={formData.address}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            address: event.target.value,
                          })
                        }
                        disabled={isSaving}
                      />
                      <Input
                        id="profile-password"
                        label="New password"
                        type="password"
                        minLength={8}
                        maxLength={50}
                        placeholder="Leave blank to keep your password"
                        value={formData.password}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            password: event.target.value,
                          })
                        }
                        disabled={isSaving}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsEditing(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" icon={Check} disabled={isSaving}>
                          {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-5">
                      <p className="text-sm leading-6 text-slate-500">
                        Your profile information is used across the workspace.
                        Select edit profile to update your details or password.
                      </p>
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        User ID{" "}
                        <span className="ml-2 font-mono font-semibold text-slate-700">
                          #{profile.emp_id}
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
                <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
                  <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Activity
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                      Account activity
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Review your latest presence in the workspace.
                    </p>
                  </div>
                </div>
                <div className="mt-6 divide-y divide-slate-100">
                  <div className="flex items-center gap-4 py-4">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${profile.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Current status
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {profile.is_active
                          ? "Currently active"
                          : "Currently offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 py-4">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Last activity
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {profile.last_seen_at
                          ? new Date(profile.last_seen_at).toLocaleString()
                          : "No recent activity recorded."}
                      </p>
                    </div>
                  </div>
                  {activity.events.map((event) => (
                    <div
                      key={`${event.event_type}-${event.occurred_at}`}
                      className="flex items-center gap-4 py-4"
                    >
                      <Activity className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-900">
                          {event.event_type}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(event.occurred_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.role.toLowerCase() === "admin" && (
              <Button
                onClick={() => router.push("/Admin")}
                className="w-full sm:w-auto"
              >
                Open admin dashboard
              </Button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
