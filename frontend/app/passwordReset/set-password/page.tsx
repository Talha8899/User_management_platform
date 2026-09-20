"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, KeyRound } from "lucide-react";
import { AuthLayout } from "../../login/AuthLayout";
import { Button, Input } from "../../Admin/components/ui";
import { API_BASE_URL } from "../../config";

export default function SetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Read the token only in the browser to keep server and client HTML stable.
    const readToken = window.setTimeout(() => {
      setToken(new URLSearchParams(window.location.search).get("token") ?? "");
    }, 0);

    return () => window.clearTimeout(readToken);
  }, []);

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError("This reset link is missing or invalid.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/password-reset/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail ?? "Could not update your password.");
      }
      setMessage(result?.message ?? "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Could not update your password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Create a new password"
      footer={
        <Link
          className="font-medium text-gray-900 hover:text-blue-600"
          href="/"
        >
          Return to sign in <ArrowRight className="inline h-3.5 w-3.5" />
        </Link>
      }
    >
      <form onSubmit={submitPassword} className="space-y-4">
        <p className="text-sm text-gray-500">
          Choose a new password with at least 8 characters.
        </p>
        {message && (
          <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Input
          id="password"
          label="New password"
          type="password"
          required
          minLength={8}
          maxLength={50}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting || !token}
        />
        <Input
          id="confirm-password"
          label="Confirm new password"
          type="password"
          required
          minLength={8}
          maxLength={50}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting || !token}
        />
        <Button
          type="submit"
          icon={KeyRound}
          disabled={isSubmitting || !token}
          className="w-full"
        >
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
