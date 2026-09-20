"use client";

import { useEffect, useState } from "react";
import { Check, Settings } from "lucide-react";
import { authenticatedFetch } from "../auth";
import { Button, Input } from "./ui";
import { API_BASE_URL } from "../../config";

type AdminProfile = {
  name: string;
  email: string;
  address: string;
};

// Admin profile settings backed by the current-user API endpoints.
export function SettingsView() {
  const [profile, setProfile] = useState<AdminProfile>({
    name: "",
    email: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        if (!response.ok) throw new Error("Could not load admin profile.");
        setProfile(await response.json());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load admin profile.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/users/update/me`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail ?? "Could not update admin profile.");
      }
      setMessage(result?.message ?? "Admin profile updated successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not update admin profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-600">Admin workspace</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          Profile settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Update the administrator account details shown across the workspace.
        </p>
      </div>
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Admin profile</h3>
            <p className="text-sm text-gray-500">
              These details belong to the signed-in administrator.
            </p>
          </div>
        </div>
        {message && (
          <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <form onSubmit={saveProfile} className="space-y-4">
          <Input
            id="admin-settings-name"
            label="Full name"
            required
            value={profile.name}
            onChange={(event) =>
              setProfile({ ...profile, name: event.target.value })
            }
            disabled={isLoading || isSaving}
          />
          <Input
            id="admin-settings-email"
            label="Email address"
            type="email"
            required
            value={profile.email}
            onChange={(event) =>
              setProfile({ ...profile, email: event.target.value })
            }
            disabled={isLoading || isSaving}
          />
          <Input
            id="admin-settings-address"
            label="Address"
            required
            value={profile.address}
            onChange={(event) =>
              setProfile({ ...profile, address: event.target.value })
            }
            disabled={isLoading || isSaving}
          />
          <div className="flex justify-end">
            <Button type="submit" icon={Check} disabled={isLoading || isSaving}>
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
