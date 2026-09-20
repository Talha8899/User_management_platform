"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LogIn } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import {
  getTokenClaims,
  isTokenExpired,
  storeAccessToken,
} from "../Admin/auth";
import { Button, Input } from "../Admin/components/ui";
import { API_BASE_URL } from "../config";

// Collects credentials, asks the API for a JWT, and routes by the returned role.
export function LoginPageForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // FastAPI's OAuth2 password flow expects form-encoded credentials.
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

      // Store the token before reading its claims for role-based navigation.
      const result: { access_token: string } = await response.json();
      storeAccessToken(result.access_token);
      const claims = getTokenClaims();
      if (!claims || isTokenExpired(claims)) {
        throw new Error("The server returned an invalid token.");
      }

      const destination =
        claims.role?.toLowerCase() === "admin" ? "/Admin" : "/me";
      router.push(destination);
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
      eyebrow="Welcome back"
      title="Sign in to your account"
      variant="login"
      footer={
        <div className="space-y-2">
          <p>
            New to the workspace?{" "}
            <Link
              className="font-medium text-gray-900 hover:text-blue-600"
              href="/login/signup"
            >
              Create an account <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
          <p>
            Administrator?{" "}
            <Link
              className="font-medium text-gray-900 hover:text-blue-600"
              href="/Admin"
            >
              Admin access <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      }
    >
      <form onSubmit={submitLogin} className="space-y-5">
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Input
          id="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
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
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
        />
        <div className="-mt-2 flex justify-end">
          <Link
            className="text-xs font-semibold text-slate-500 hover:text-slate-950"
            href="/passwordReset"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          type="submit"
          icon={LogIn}
          disabled={isSubmitting}
          className="mt-2 w-full"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
