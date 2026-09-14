import { ownerSignInUrl, setting, trustedOwner } from "@/db/runtime";

const COOKIE = "habitat_owner";
const DAY = 86400;
const encoder = new TextEncoder();
async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}
// Fixed-length digests avoid timing-dependent comparisons of the configured secret.
export async function equalSecret(left: string, right: string) {
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(left)), crypto.subtle.digest("SHA-256", encoder.encode(right))]);
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") !== "cross-site" && (!origin || origin === new URL(request.url).origin);
}
export function accessOptions() {
  return { canSignIn: setting("HABITAT_OWNER_KEY").length >= 32, signInUrl: ownerSignInUrl() };
}
export async function isOwner(request: Request, now = Date.now()): Promise<boolean> {
  if (new URL(request.url).searchParams.get("mode") === "visitor") return false;
  if (trustedOwner(request)) return true;
  const secret = setting("HABITAT_OWNER_KEY");
  if (secret.length < 32) return false;
  const cookie = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!cookie || !/^\d{10,14}\.[a-f0-9]{64}$/.test(cookie)) return false;
  const [expiry, digest] = cookie.split(".");
  if (Number(expiry) <= now || Number(expiry) > now + 7 * DAY * 1000 + 1000) return false;
  return equalSecret(digest, await signature(`owner:${expiry}`, secret));
}
export async function ownerCookie(request: Request, clear = false, now = Date.now()) {
  const expiry = String(now + 7 * DAY * 1000);
  const value = clear ? "" : `${expiry}.${await signature(`owner:${expiry}`, setting("HABITAT_OWNER_KEY"))}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear ? 0 : 7 * DAY}${secure}`;
}
export async function verifyOwnerKey(key: string) {
  const configured = setting("HABITAT_OWNER_KEY");
  return configured.length >= 32 && equalSecret(key, configured);
}
