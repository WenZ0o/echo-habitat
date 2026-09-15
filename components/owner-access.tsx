"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { WorldResponse } from "@/lib/habitat/types";

export function OwnerAccess({ data, refresh, visitorMode = false }: { data: WorldResponse; refresh: () => Promise<void>; visitorMode?: boolean }) {
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
  if (visitorMode) return <a className="visitor-link-button" href="/" aria-label="Leave the visitor link to access owner sign-in"><KeyRound size={13}/>Owner access</a>;
  if (data.mode === "owner") return data.access?.canSignIn ? <><button className="visitor-link-button" onClick={() => void signOut()} disabled={busy}><LogOut size={13}/>Sign out</button>{error && <span role="alert">{error}</span>}</> : null;
  if (data.access?.signInUrl) return <a className="visitor-link-button" href={data.access.signInUrl}>Owner sign-in</a>;
  const canSignIn = data.access?.canSignIn === true;
  return <Dialog open={open} onOpenChange={value => { setOpen(value); setError(""); if (!value) setKey(""); }}>
    <DialogTrigger asChild><button className="visitor-link-button"><KeyRound size={13}/>{canSignIn ? "Owner sign-in" : "Owner setup"}</button></DialogTrigger>
    <DialogContent className="about-dialog"><DialogHeader><DialogTitle>{canSignIn ? "Return to your habitat." : "Enable your owner controls."}</DialogTitle><DialogDescription>GitHub ownership does not sign you into this simulation. Owner controls require a separate, private owner key.</DialogDescription></DialogHeader>
      {!canSignIn ? <div className="owner-setup">
        <p>Owner sign-in is not configured for this deployment.</p>
        <ol>
          <li>Open the Vercel project serving this address, then Settings → Environment Variables.</li>
          <li>Set <code>HABITAT_OWNER_KEY</code> to a unique, random secret of 32–512 characters, generated in your password manager. Enable it for Production.</li>
          <li>Redeploy, open this site again, and choose Owner sign-in.</li>
        </ol>
        <p>Keep this key out of GitHub, chat messages and visitor links. Never use your Blob token or API key for this.</p>
      </div> : <>
      <p className="owner-access-note">Sign in in the browser you use to watch the world. Another phone, browser or in-app browser needs its own sign-in.</p>
      <form onSubmit={signIn} className="owner-form"><label htmlFor="owner-key">Owner key</label><Input id="owner-key" type="password" autoComplete="current-password" value={key} onChange={event => setKey(event.target.value)} required minLength={32} maxLength={512}/>{error && <p role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy ? "Signing in…" : "Open owner controls"}</Button></form>
      </>}
    </DialogContent>
  </Dialog>;
}
