"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { WorldResponse } from "@/lib/habitat/types";

export function OwnerAccess({ data, refresh }: { data: WorldResponse; refresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false), [key, setKey] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function signIn(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed.");
      setKey(""); setOpen(false); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign in."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/access", { method: "DELETE" });
      if (!response.ok) throw new Error("Sign-out failed. Please try again.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign out."); }
    finally { setBusy(false); }
  }
  if (data.mode === "owner") return data.access?.canSignIn ? <><button className="visitor-link-button" onClick={() => void signOut()} disabled={busy}><LogOut size={13}/>Sign out</button>{error && <span role="alert">{error}</span>}</> : null;
  if (data.access?.signInUrl) return <a className="visitor-link-button" href={data.access.signInUrl}>Owner sign-in</a>;
  if (!data.access?.canSignIn) return null;
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setError(""); if (!value) setKey(""); }}>
    <DialogTrigger asChild><button className="visitor-link-button"><KeyRound size={13}/>Owner sign-in</button></DialogTrigger>
    <DialogContent className="about-dialog"><DialogHeader><DialogTitle>Return to your habitat.</DialogTitle><DialogDescription>Enter your private owner key to control the clock and introduce events.</DialogDescription></DialogHeader>
      <form onSubmit={signIn} className="owner-form"><label htmlFor="owner-key">Owner key</label><Input id="owner-key" type="password" autoComplete="current-password" value={key} onChange={event => setKey(event.target.value)} required minLength={32} maxLength={512}/>{error && <p role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Open owner controls"}</Button></form>
    </DialogContent>
  </Dialog>;
}
