"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, User } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin-session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace("/admin");
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push("/admin");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#03080e] flex flex-col md:flex-row font-sans selection:bg-fortress-gold/20 selection:text-fortress-champagne">
      {/* Left Panel - Branding */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-fortress-navy relative flex-col justify-between p-12 lg:p-24 border-r border-fortress-gold/10 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-fortress-deep to-fortress-navy" />
        <div className="absolute -left-[10%] -top-[10%] w-[120%] h-[120%] opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10">
          <Image
            src="/large-logo.png"
            alt="Fortress Investment Holdings"
            width={400}
            height={120}
            className="h-16 w-auto object-contain brightness-110 drop-shadow-sm mb-16"
          />
          <h1 className="text-4xl lg:text-5xl font-bold text-fortress-ivory leading-[1.1] tracking-tight max-w-xl">
            Secure Portal for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fortress-champagne to-fortress-gold">Authorized Management</span>
          </h1>
          <p className="text-fortress-silver/80 mt-6 text-lg max-w-md leading-relaxed font-light">
            Access internal systems, manage enquiries, and oversee investment operations through our secure administrative interface.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-3 text-fortress-silver/50 text-sm font-medium tracking-wide">
          <Shield className="w-5 h-5 text-fortress-gold/70" />
          <span>Secured with Enterprise-Grade Encryption</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-20 bg-[#02050A] relative">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-10">
            <Image
              src="/large-logo.png"
              alt="Fortress Investment Holdings"
              width={320}
              height={96}
              className="h-12 w-auto mx-auto object-contain brightness-110"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-fortress-ivory tracking-tight">Sign In</h2>
            <p className="text-fortress-silver/60 text-sm mt-1.5 font-medium">Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-bold text-fortress-silver/80 uppercase tracking-widest mb-2"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fortress-silver/30" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full bg-[#050B14] border border-fortress-charcoal rounded-lg text-fortress-ivory text-sm pl-11 pr-4 py-3.5 focus:outline-none focus:border-fortress-gold/60 focus:bg-[#07111D] transition-colors placeholder:text-fortress-silver/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-fortress-silver/80 uppercase tracking-widest mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fortress-silver/30" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#050B14] border border-fortress-charcoal rounded-lg text-fortress-ivory text-sm pl-11 pr-12 py-3.5 focus:outline-none focus:border-fortress-gold/60 focus:bg-[#07111D] transition-colors placeholder:text-fortress-silver/20 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-fortress-silver/30 hover:text-fortress-silver/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fortress-gold hover:bg-fortress-champagne text-fortress-navy font-bold text-sm py-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-12 pt-6 border-t border-fortress-charcoal">
            <p className="text-fortress-silver/40 text-xs font-medium tracking-wide">
              &copy; {new Date().getFullYear()} Fortress Investment Holdings.
            </p>
            <div className="flex gap-4 mt-2">
              <span className="text-fortress-silver/30 text-[10px] uppercase tracking-wider">Privacy Policy</span>
              <span className="text-fortress-silver/30 text-[10px] uppercase tracking-wider">Terms of Service</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
