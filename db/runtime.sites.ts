import { env } from "cloudflare:workers";

export function setting(name: string): string {
  return String((env as unknown as Record<string, unknown>)[name] ?? "");
}
export function trustedOwner(request: Request): boolean {
  const owner = setting("HABITAT_OWNER_EMAIL").trim().toLowerCase();
  return !!owner && !!request.headers.get("oai-authenticated-user-id") && request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() === owner;
}
export function ownerSignInUrl(): string { return "/signin-with-chatgpt?return_to=%2F"; }
