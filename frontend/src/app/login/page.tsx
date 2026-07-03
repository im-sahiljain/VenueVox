"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole =
    (searchParams.get("role") as "organization" | "performer") ||
    "organization";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"organization" | "performer">(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedState, setSelectedState] = useState("Punjab");
  const [selectedCity, setSelectedCity] = useState("Chandigarh");

  useEffect(() => {
    // If already logged in, redirect
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "organization") {
          router.push("/dashboard/organization");
        } else {
          router.push("/dashboard/performer");
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.login(email, role, selectedState, selectedCity);
      if (response.success && response.data) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        if (response.data.performer) {
          localStorage.setItem(
            "performer",
            JSON.stringify(response.data.performer),
          );
        } else {
          localStorage.removeItem("performer");
        }
        if (response.data.organization) {
          localStorage.setItem(
            "organization",
            JSON.stringify(response.data.organization),
          );
        } else {
          localStorage.removeItem("organization");
        }

        // Redirect based on role
        if (role === "organization") {
          router.push("/dashboard/organization");
        } else {
          router.push("/dashboard/performer");
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Unable to connect to the server. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = (
    demoType:
      | "org1"
      | "org2"
      | "mgr1"
      | "mgr2"
      | "mgr3"
      | "mgr4"
      | "perf1"
      | "perf2"
      | "perf3",
  ) => {
    if (demoType === "org1") {
      setEmail("org1@stagehub.com");
      setPassword("org1@stagehub");
      setRole("organization");
    } else if (demoType === "org2") {
      setEmail("org2@stagehub.com");
      setPassword("org2@stagehub");
      setRole("organization");
    } else if (demoType === "mgr1") {
      setEmail("john@stagehub.com");
      setPassword("mgr1@stagehub");
      setRole("organization");
    } else if (demoType === "mgr2") {
      setEmail("alice@stagehub.com");
      setPassword("mgr2@stagehub");
      setRole("organization");
    } else if (demoType === "mgr3") {
      setEmail("david@stagehub.com");
      setPassword("mgr3@stagehub");
      setRole("organization");
    } else if (demoType === "mgr4") {
      setEmail("emma@stagehub.com");
      setPassword("mgr4@stagehub");
      setRole("organization");
    } else if (demoType === "perf1") {
      setEmail("perf1@stagehub.com");
      setPassword("perf1@stagehub");
      setRole("performer");
    } else if (demoType === "perf2") {
      setEmail("perf2@stagehub.com");
      setPassword("perf2@stagehub");
      setRole("performer");
    } else {
      setEmail("perf3@stagehub.com");
      setPassword("perf3@stagehub");
      setRole("performer");
    }
  };

  return (
    <div className="min-h-screen bg-[url('/background_login.gif')] bg-cover bg-center bg-no-repeat bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-auto space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="bg-rose-500 text-white p-2 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Venue<span className="text-rose-500">Vox</span>
            </span>
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Sign in to VenueVox
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter any email and password to log in.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:gap-6">
          <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
            {/* Role selection tabs */}
            <div className="p-1 bg-slate-100 rounded-xl flex gap-1">
              <Button
                type="button"
                onClick={() => setRole("organization")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  role === "organization"
                    ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                    : "text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent"
                }`}
              >
                Organization / Venue
              </Button>
              <Button
                type="button"
                onClick={() => setRole("performer")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  role === "performer"
                    ? "bg-white text-slate-900 shadow-sm hover:bg-white"
                    : "text-slate-500 hover:text-slate-900 bg-transparent hover:bg-transparent"
                }`}
              >
                Performer / Artist
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Password (Dummy)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      // Set default city based on state selection
                      if (e.target.value === "Punjab") setSelectedCity("Chandigarh");
                      else if (e.target.value === "Karnataka") setSelectedCity("Bengaluru");
                      else if (e.target.value === "Maharashtra") setSelectedCity("Mumbai");
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm bg-white"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition text-sm bg-white"
                  >
                    {selectedState === "Punjab" && <option value="Chandigarh">Chandigarh</option>}
                    {selectedState === "Karnataka" && <option value="Bengaluru">Bengaluru</option>}
                    {selectedState === "Maharashtra" && <option value="Mumbai">Mumbai</option>}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 rounded-xl text-sm font-semibold disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>

          {/* Demo Accounts Panel */}
          <div className="border-t border-slate-100 pt-6 md:border-none md:pl-6 md:space-y-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Select a Demo Account and Sign in</span>
            </div>

            {/* Group 1: ABC Group */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ABC Hospitality Group (Owner 1)
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("org1")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    ABC Owner
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    org1@stagehub.com
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("mgr1")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    John (Mgr)
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Sector 17 Cafe
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("mgr2")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    Alice (Mgr)
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Downtown Club
                  </span>
                </Button>
              </div>
            </div>

            {/* Group 2: XYZ Group */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                XYZ Entertainment Group (Owner 2)
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("org2")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    XYZ Owner
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    org2@stagehub.com
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("mgr3")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    David (Mgr)
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Redwood Tavern
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("mgr4")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-rose-600">
                    Emma (Mgr)
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Skyline Rooftop
                  </span>
                </Button>
              </div>
            </div>

            {/* Group 3: Performers */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Performers / Artists
              </span>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("perf1")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-emerald-600">
                    Sarah & Jack
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Acoustic Duo
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("perf2")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-blue-600">
                    DJ Electro
                  </span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    House/Techno
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadDemo("perf3")}
                  className="p-2 h-auto bg-slate-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-slate-900 font-medium rounded-xl transition text-left flex flex-col items-start cursor-pointer"
                >
                  <span className="block font-bold text-indigo-600">Mike</span>
                  <span className="text-[9px] text-slate-500 truncate block w-full">
                    Stand-up Comic
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
