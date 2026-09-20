"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { AuthLayout } from "../login/AuthLayout";
import { Button, Input } from "../Admin/components/ui";
import { API_BASE_URL } from "../config";

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/users/password-reset/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.detail ?? "Could not request a password reset.",
        );
      }
      setMessage(result?.message ?? "Check your email for a reset link.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not request a password reset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      footer={
        <Link
          className="font-medium text-gray-900 hover:text-blue-600"
          href="/"
        >
          Return to sign in <ArrowRight className="inline h-3.5 w-3.5" />
        </Link>
      }
    >
      <form onSubmit={submitRequest} className="space-y-4">
        <p className="text-sm text-gray-500">
          Enter your registered email and we will send you a secure reset link.
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
        <Button
          type="submit"
          icon={Mail}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
