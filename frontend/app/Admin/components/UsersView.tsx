"use client";

import {
  AlertCircle,
  Edit2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User as UserIcon,
  Activity,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRecord } from "../types";
import { getAvatarUrl } from "../avatar";
import { Badge, Button, Input, Modal, Select } from "./ui";

type UserFormData = Pick<UserRecord, "name" | "email" | "address" | "role"> & {
  password?: string;
};

// UI contract: the page owns API calls while this component owns table and form state.
// Props keep API ownership in the page coordinator while this component owns user UI state.
type UsersViewProps = {
  users: UserRecord[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalUsers: number;
  error: string | null;
  onRetry: () => void;
  onLoadMore: () => Promise<void>;
  onSearchById: (userId: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSave: (user: UserFormData, editingUser: UserRecord | null) => Promise<void>;
};

export function UsersView({
  users,
  isLoading,
  isLoadingMore,
  hasMore,
  totalUsers,
  error,
  onRetry,
  onLoadMore,
  onSearchById,
  onDelete,
  onSave,
}: UsersViewProps) {
  const router = useRouter();
  // Local UI state covers ID lookup, the modal, and the form currently being edited.
  const [userIdQuery, setUserIdQuery] = useState("");
  const [isSearchingById, setIsSearchingById] = useState(false);
  const [idSearchError, setIdSearchError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    address: "",
    email: "",
    role: "user",
    password: "",
  });

  // The backend owns user lookup; this view displays the returned collection as-is.
  const visibleUsers = users;

  // Prepare a blank form for creating a new user.
  const openAddModal = () => {
    setEditingUser(null);
    setSaveError(null);
    setFormData({
      name: "",
      address: "",
      email: "",
      role: "user",
      password: "",
    });
    setIsModalOpen(true);
  };
  // Load an existing user into the shared modal form for editing.
  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setSaveError(null);
    setFormData({
      // API data is normalized so every form control always receives a string.
      name: user.name ?? "",
      address: user.address ?? "",
      email: user.email ?? "",
      // Preserve the saved role; do not silently demote an existing admin.
      role: user.role?.toLowerCase() ?? "user",
    });
    setIsModalOpen(true);
  };

  // Look up one user through the backend ID endpoint.
  const searchById = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userId = Number(userIdQuery);
    if (!Number.isInteger(userId) || userId < 1) {
      return;
    }

    setIsSearchingById(true);
    setIdSearchError(null);
    try {
      await onSearchById(userId);
    } catch (searchError) {
      setIdSearchError(
        searchError instanceof Error ? searchError.message : "User not found",
      );
    } finally {
      setIsSearchingById(false);
    }
  };

  // Restore the full user list after an ID-specific lookup.
  const clearIdSearch = () => {
    setUserIdQuery("");
    setIdSearchError(null);
    onRetry();
  };
  // Submit the form through the page-level API handler.
  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await onSave(formData, editingUser);
      setIsModalOpen(false);
    } catch (saveErrorValue) {
      setSaveError(
        saveErrorValue instanceof Error
          ? saveErrorValue.message
          : "Could not save the user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  // Confirm destructive actions before sending them to the backend.
  const deleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await onDelete(id);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Backend errors and retry action. */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Connection Error
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Connection
            </button>
          </div>
        </div>
      )}
      {/* Search and create-user controls. */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-gray-500">
            Manage your team members and their account permissions.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <form onSubmit={searchById} className="flex items-center gap-2">
            <Input
              id="user-id-search"
              aria-label="Search by user ID"
              type="number"
              min={1}
              placeholder="ID"
              value={userIdQuery}
              onChange={(event) => setUserIdQuery(event.target.value)}
              className="w-20"
            />
            <Button
              type="submit"
              icon={Search}
              disabled={isSearchingById || !userIdQuery}
              aria-label="Search by user ID"
            >
              Search
            </Button>
          </form>
          {userIdQuery && (
            <Button variant="ghost" onClick={clearIdSearch}>
              Clear
            </Button>
          )}
          <Button onClick={openAddModal} icon={Plus}>
            Add User
          </Button>
        </div>
      </div>
      {idSearchError && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {idSearchError}
        </p>
      )}
      {/* User table with loading, empty, and populated states. */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 font-medium text-gray-500">User</th>
                <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-gray-300" />
                    Loading users from backend...
                  </td>
                </tr>
              ) : visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr
                    key={user.emp_id}
                    className="group transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {user.emp_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user.name)}
                          alt={user.name}
                          className="h-9 w-9 rounded-full border border-gray-200 bg-gray-100 object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        {user.role?.toLowerCase() === "admin" && (
                          <Shield className="h-3.5 w-3.5 text-indigo-500" />
                        )}
                        {user.role?.toLowerCase() === "editor" && (
                          <Edit2 className="h-3.5 w-3.5 text-blue-500" />
                        )}
                        {(user.role?.toLowerCase() === "user" ||
                          !user.role) && (
                          <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                        )}
                        {user.role || "User"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_active ? "success" : "default"}>
                        {user.is_active ? "Active" : "Offline"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() =>
                            router.push(`/Admin/activity/${user.emp_id}`)
                          }
                          className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="View activity"
                        >
                          <Activity className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteUser(user.emp_id)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        className="p-1.5 text-gray-400 sm:hidden"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-3 text-xs text-gray-500">
          <div className="flex items-center justify-between gap-3">
            <span>
              Showing {visibleUsers.length} of {totalUsers} users
            </span>
            {hasMore && (
              <Button
                variant="ghost"
                onClick={() => void onLoadMore()}
                disabled={isLoadingMore}
                className="px-2 py-1 text-xs"
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Add/edit form modal. */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={saveUser} className="space-y-4">
          {saveError && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {saveError}
            </p>
          )}
          <Input
            label="Full Name"
            id="name"
            placeholder="e.g. Jane Doe"
            required
            value={formData.name}
            onChange={(event) =>
              setFormData({ ...formData, name: event.target.value })
            }
            disabled={isSubmitting}
          />
          {!editingUser && (
            <Input
              label="Password"
              id="password"
              type="password"
              minLength={8}
              maxLength={50}
              required
              value={formData.password ?? ""}
              onChange={(event) =>
                setFormData({ ...formData, password: event.target.value })
              }
              disabled={isSubmitting}
            />
          )}
          {/* Existing users keep their current email unless the admin changes it. */}
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="jane@example.com"
            required={!editingUser}
            value={formData.email}
            onChange={(event) =>
              setFormData({ ...formData, email: event.target.value })
            }
            disabled={isSubmitting}
          />
          <Input
            label="Address"
            id="address"
            required
            value={formData.address}
            onChange={(event) =>
              setFormData({ ...formData, address: event.target.value })
            }
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role"
              id="role"
              value={formData.role}
              onChange={(event) =>
                setFormData({ ...formData, role: event.target.value })
              }
              disabled={isSubmitting}
              options={[
                { label: "User", value: "user" },
                { label: "Editor", value: "editor" },
                { label: "Admin", value: "admin" },
              ]}
            />
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingUser
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
