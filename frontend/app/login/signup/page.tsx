"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
import { AuthLayout } from "../AuthLayout";
import { Button, Input } from "../../Admin/components/ui";
import { API_BASE_URL } from "../../config";

// Shape required by the backend signup endpoint.
type SignupForm = {
  name: string;
  address: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>({
    name: "",
    address: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof SignupForm, value: string) => {
    // Update only the field being edited while preserving the other values.
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      // The signup route accepts the complete user object as JSON.
      const response = await fetch(`${API_BASE_URL}/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.detail ?? "Could not create your account.");
      }
      setMessage("Account created. You can now sign in.");
      setForm({ name: "", address: "", email: "", password: "" });
    } catch (signupError) {
      setError(
        signupError instanceof Error ? signupError.message : "Signup failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      footer={
        <span>
          Already registered?{" "}
          <Link
            className="font-medium text-gray-900 hover:text-blue-600"
            href="/login"
          >
            Sign in <ArrowRight className="inline h-3.5 w-3.5" />
          </Link>
        </span>
      }
    >
      <form onSubmit={submitSignup} className="space-y-4">
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
          id="name"
          label="Full name"
          required
          minLength={2}
          maxLength={50}
          autoComplete="name"
          placeholder="Your full name"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          id="address"
          label="Address"
          required
          minLength={1}
          maxLength={100}
          autoComplete="street-address"
          placeholder="Your address"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          id="email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          disabled={isSubmitting}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          maxLength={50}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          icon={UserPlus}
          disabled={isSubmitting}
          className="mt-2 w-full"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
