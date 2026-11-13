"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Mode = "login" | "register";
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setError("");
    try {
      const body = mode === "register" ? { email, password, display_name: name } : { email, password };
      await api(mode === "register" ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(body) });
      router.replace("/dashboard"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unexpected error"); }
    finally { setWorking(false); }
  }
  return <main className="min-h-screen flex items-center justify-center px-4 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/70 p-8 shadow-2xl">
      <p className="text-sky-400 text-sm font-semibold tracking-wider mb-2">SAFESPHERE AI</p>
      <h1 className="text-3xl font-bold mb-2">{mode === "register" ? "Create an account" : "Welcome back"}</h1>
      <p className="text-sm text-slate-400 mb-7">Demo foundation — no AI scans run in Phase 1.</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && <label className="block text-sm">Display name<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-3" placeholder="Your name" /></label>}
        <label className="block text-sm">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-3" placeholder="you@example.com" /></label>
        <label className="block text-sm">Password<input required type="password" minLength={mode === "register" ? 12 : undefined} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 px-3 py-3" placeholder="12+ characters for registration" /></label>
        {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button type="submit" disabled={working} className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg p-3 font-semibold">{working ? "Please wait..." : mode === "register" ? "Create account" : "Log in"}</button>
      </form>
      <p className="mt-5 text-sm text-slate-400">{mode === "register" ? "Already registered?" : "New to SafeSphere?"} <Link className="text-sky-400 hover:underline" href={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Log in" : "Create an account"}</Link></p>
    </div>
  </main>;
}
