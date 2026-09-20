"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/AdminShell";
import { DashboardView } from "./components/DashboardView";
import { SettingsView } from "./components/SettingsView";
import { UsersView } from "./components/UsersView";
import { LoginForm } from "./components/LoginForm";
import { API_BASE_URL } from "../config";
import {
  authHeaders,
  authenticatedFetch,
  clearAccessToken,
  getAccessToken,
  getTokenClaims,
  isTokenExpired,
  refreshAccessToken,
} from "./auth";
import type { AdminView, UserRecord } from "./types";

type UserFormData = Pick<UserRecord, "name" | "email" | "address" | "role"> & {
  password?: string;
};

type PaginatedUsersResponse = {
  users: UserRecord[];
  total: number;
  limit: number;
  skip: number;
  has_more: boolean;
  last_seen: (string | null)[];
};

export default function AdminPage() {
  // The page coordinates navigation, user data, presence, and backend operations.
  const [activeView, setActiveView] = useState<AdminView>("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<UserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Read browser-only authentication state after hydration is complete.
  useEffect(() => {
    const readAuthState = window.setTimeout(() => {
      const token = getAccessToken();
      const claims = getTokenClaims();
      const isAdmin = claims?.role?.toLowerCase() === "admin";

      if (!token || !claims || !isAdmin) {
        clearAccessToken();
      } else if (isTokenExpired(claims)) {
        void refreshAccessToken().then((refreshedToken) => {
          if (refreshedToken) setAccessToken(refreshedToken);
          else clearAccessToken();
        });
      } else {
        setAccessToken(token);
      }

      setIsMounted(true);
    }, 0);

    return () => window.clearTimeout(readAuthState);
  }, []);

  // Load the canonical user list and expose connection errors to child views.
  const fetchUsers = async (skip = 0, append = false) => {
    if (append) {
      setIsLoadingMoreUsers(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const query = skip > 0 ? `?skip=${skip}` : "";
      const response = await authenticatedFetch(
        `${API_BASE_URL}/users${query}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const payload: PaginatedUsersResponse = await response.json();
      const loadedUsers = payload.users;
      setUsers((currentUsers) =>
        append ? [...currentUsers, ...loadedUsers] : loadedUsers,
      );
      setDisplayedUsers((currentUsers) =>
        append ? [...currentUsers, ...loadedUsers] : loadedUsers,
      );
      setTotalUsers(payload.total);
      setHasMoreUsers(payload.has_more);

      if (!append) {
        // Use the authenticated admin's database record for the header avatar.
        const claims = getTokenClaims();
        const signedInAdmin = loadedUsers.find(
          (user) => user.emp_id === Number(claims?.sub),
        );
        setAdminName(signedInAdmin?.name ?? "Admin");
      }
    } catch (fetchError) {
      setUsers([]);
      setDisplayedUsers([]);
      setTotalUsers(0);
      setHasMoreUsers(false);
      setAdminName("Admin");
      setError("Could not connect to the backend.");
      console.error(fetchError);
    } finally {
      if (append) {
        setIsLoadingMoreUsers(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const loadMoreUsers = async () => {
    await fetchUsers(users.length, true);
  };

  // Fetch the initial data when the admin panel mounts.
  useEffect(() => {
    if (!accessToken) return;

    // Keep the signed-in administrator present while the admin page is open.
    const initialLoad = window.setTimeout(() => void fetchUsers(), 0);
    const heartbeat = window.setInterval(() => {
      void authenticatedFetch(`${API_BASE_URL}/users/me/heartbeat`, {
        method: "POST",
      });
    }, 30_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(heartbeat);
    };
  }, [accessToken]);

  // Derive dashboard totals from the same user list shown in the Users view.
  const stats = useMemo(() => {
    const active = users.filter((user) => user.is_active).length;
    return {
      total: totalUsers,
      active,
      offline: Math.max(totalUsers - active, 0),
    };
  }, [users, totalUsers]);

  const handleLogout = async () => {
    // Clear backend presence first, then remove the browser token locally.
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
      });
    } finally {
      clearAccessToken();
      setAccessToken(null);
      setUsers([]);
      setDisplayedUsers([]);
      setTotalUsers(0);
      setHasMoreUsers(false);
      setAdminName("Admin");
    }
  };

  // Fetch one user by the ID entered in the admin search control.
  const handleSearchById = async (userId: number) => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/users/${userId}`,
    );

    if (!response.ok) {
      throw new Error("User not found");
    }

    const matchingUser: UserRecord = await response.json();
    setDisplayedUsers([matchingUser]);
  };

  if (!isMounted) {
    // Keep server HTML and the first client render identical.
    return null;
  }

  if (!accessToken) {
    // The admin area is protected by the same login component used for its auth state.
    return <LoginForm onLogin={() => setAccessToken(getAccessToken())} />;
  }

  // Delete a user remotely, then remove it from the local screen state.
  const handleDelete = async (id: number) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.emp_id !== id),
      );
    } catch (deleteError) {
      alert(
        `Error deleting user: ${deleteError instanceof Error ? deleteError.message : "Unknown error"}`,
      );
    }
  };

  // Create or update a user, then synchronize the returned record locally.
  const handleSave = async (
    formData: UserFormData,
    editingUser: UserRecord | null,
  ) => {
    const endpoint = editingUser
      ? `${API_BASE_URL}/users/${editingUser.emp_id}`
      : `${API_BASE_URL}/users/signup`;
    const method = editingUser ? "PATCH" : "POST";

    // Password is needed for signup only; PATCH accepts profile fields only.
    const requestBody = editingUser
      ? {
          name: formData.name.trim(),
          address: formData.address.trim(),
          ...(formData.email.trim()
            ? { email: formData.email.trim().toLowerCase() }
            : {}),
          ...(formData.role.trim() ? { role: formData.role.trim() } : {}),
        }
      : formData;

    const response = await authenticatedFetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      const detail = Array.isArray(result?.detail)
        ? result.detail
            .map((item: { msg?: string }) => item.msg ?? "Validation error")
            .join("; ")
        : typeof result?.detail === "string"
          ? result.detail
          : `Failed to ${editingUser ? "update" : "create"} user`;
      throw new Error(detail);
    }

    // Signup and PATCH return messages, so reload canonical user data afterward.
    await fetchUsers();
  };

  // Render exactly one panel inside the shared shell based on sidebar selection.
  const content =
    activeView === "dashboard" ? (
      <DashboardView isLoading={isLoading} error={error} {...stats} />
    ) : activeView === "settings" ? (
      <SettingsView />
    ) : (
      <UsersView
        users={displayedUsers}
        isLoading={isLoading}
        isLoadingMore={isLoadingMoreUsers}
        hasMore={hasMoreUsers}
        totalUsers={totalUsers}
        error={error}
        onRetry={fetchUsers}
        onLoadMore={loadMoreUsers}
        onSearchById={handleSearchById}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    );

  return (
    <AdminShell
      activeView={activeView}
      onViewChange={setActiveView}
      onLogout={handleLogout}
      adminName={adminName}
    >
      {content}
    </AdminShell>
  );
}
