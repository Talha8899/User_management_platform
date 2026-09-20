import { Database, Shield } from "lucide-react";
import type { ReactNode } from "react";

// Shared visual frame for login, signup, and profile screens.
export function AuthLayout({
  title,
  eyebrow,
  children,
  footer,
  variant = "default",
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "default" | "login";
}) {
  if (variant === "login") {
    return (
      <main className="relative isolate flex min-h-screen overflow-hidden bg-white px-4 py-8 text-gray-900 sm:px-6 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="login-ambient" />
        </div>

        <div className="absolute left-5 top-6 z-10 flex items-center gap-3 sm:left-8 sm:top-8 lg:left-10 lg:top-10">
          <div className="rounded-md bg-gray-900 p-2 text-white shadow-sm">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              User Management
            </p>
            <p className="text-xs text-gray-500">Secure workspace access</p>
          </div>
        </div>

        <section className="relative z-10 m-auto w-full max-w-[460px]">
          <div className="rounded-2xl border border-gray-200/90 bg-white/95 p-7 shadow-[0_24px_70px_-28px_rgba(37,99,235,0.35)] backdrop-blur-sm sm:p-10">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium text-blue-600">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your details to continue to your workspace.
              </p>
            </div>
            <div>{children}</div>
            <div className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
              {footer}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Protected workspace · 2026
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbff] px-4 py-10 text-gray-900">
      <div
        className="auth-ambient pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <section className="relative z-10 w-full max-w-md rounded-xl border border-gray-200/90 bg-white/95 p-7 shadow-[0_24px_70px_-32px_rgba(37,99,235,0.35)] backdrop-blur-sm sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-md bg-gray-900 p-2 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-gray-900">
              User Management
            </p>
            <p className="text-xs text-gray-500">Secure workspace access</p>
          </div>
        </div>
        <p className="text-sm font-medium text-blue-600">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        <div className="mt-6">{children}</div>
        <div className="mt-7 border-t border-gray-100 pt-5 text-center text-sm text-gray-500">
          {footer}
        </div>
      </section>
    </main>
  );
}
