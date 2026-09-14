// Request identity headers are not trusted on Vercel. Owner access uses a signed cookie.
export function setting(name: string): string { return process.env[name] ?? ""; }
export function trustedOwner(request: Request): boolean { void request; return false; }
export function ownerSignInUrl(): string | undefined { return undefined; }
