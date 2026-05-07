"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <aside className="flex w-full items-center justify-center bg-admin-sidebar-bg px-5 py-10 md:w-1/2 md:min-h-screen md:py-0">
        <Image
          src="/figma-assets/admin-login/iais-logo.png"
          alt="International Association of Insurance Supervisors"
          width={1826}
          height={389}
          priority
          className="h-auto w-full max-w-[280px] md:max-w-[441px]"
          sizes="(max-width: 768px) 280px, 441px"
        />
      </aside>

      <section className="flex w-full flex-1 items-center justify-center bg-white px-6 py-10 md:w-1/2 md:min-h-screen md:border md:border-admin-border md:px-[120px] md:py-0">
        <div className="w-full">
          <div className="rounded-bl-[20px] rounded-br-[20px] rounded-tr-[20px] bg-white p-8">
            <form onSubmit={(e) => void onSubmit(e)} className="flex w-full flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-[24px] font-bold leading-tight text-black">Login</h1>
                <p className="text-[16px] text-[#828282]">Please sign in to continue</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 pt-1.5">
                  <label htmlFor="admin-email" className="text-[13px] text-black">
                    Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-2xl border border-[#bdbdbd] bg-white py-2 pl-4 pr-2 text-[14px] leading-5 text-ink placeholder:text-[#808080] outline-none focus:border-admin-navy focus:ring-2 focus:ring-admin-navy/20"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 pt-1.5">
                  <label htmlFor="admin-password" className="text-[13px] text-black">
                    Password
                  </label>
                  <div className="relative w-full">
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-[#bdbdbd] bg-white py-2 pl-4 pr-12 text-[14px] leading-5 text-ink placeholder:text-[#808080] outline-none focus:border-admin-navy focus:ring-2 focus:ring-admin-navy/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-2 flex items-center justify-center p-2 text-[#808080] hover:text-admin-navy"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/figma-assets/admin-login/eye-icon.svg"
                        alt=""
                        width={16}
                        height={16}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center rounded-2xl bg-admin-navy px-4 text-[12px] leading-5 text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
