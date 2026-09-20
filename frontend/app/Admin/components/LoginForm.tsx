"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import {
  clearAccessToken,
  getTokenClaims,
  isTokenExpired,
  storeAccessToken,
} from "../auth";
import { AuthLayout } from "../../login/AuthLayout";
import { Button, Input } from "./ui";
import { API_BASE_URL } from "../../config";

// Administrator-only login form shown when the admin token is missing.
export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Match the backend OAuth2 password form contract.
      const body = new URLSearchParams({ username: email, password });
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body,
      });

      if (!response.ok) {
        throw new Error("Invalid email or password.");
      }

      const result: { access_token: string } = await response.json();
      storeAccessToken(result.access_token);
      const claims = getTokenClaims();
      if (!claims || isTokenExpired(claims)) {
        clearAccessToken();
        throw new Error("The server returned an invalid token.");
      }
      if (claims.role?.toLowerCase() !== "admin") {
        clearAccessToken();
        throw new Error("Administrator credentials are required.");
      }
      onLogin();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Login failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Administrator access"
      title="Sign in to Admin"
      footer={
        <p className="text-xs text-gray-500">
          Administrator credentials are required to access this workspace.
        </p>
      }
    >
      <form onSubmit={submitLogin} className="space-y-4">
        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          icon={LogIn}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
