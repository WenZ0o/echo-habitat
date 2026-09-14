import { ownerCookie, sameOrigin, verifyOwnerKey } from "@/lib/habitat/access";

const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Open sign-in from the habitat." }, { status: 403, headers });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Expected JSON." }, { status: 415, headers });
  const body = await request.text();
  if (body.length > 2048) return Response.json({ error: "Invalid owner key." }, { status: 413, headers });
  let key: unknown;
  try { key = JSON.parse(body)?.key; } catch { /* Invalid credentials get the same response. */ }
  if (typeof key !== "string" || !await verifyOwnerKey(key)) return Response.json({ error: "That owner key is not valid." }, { status: 401, headers });
  return Response.json({ ok: true }, { headers: { ...headers, "Set-Cookie": await ownerCookie(request) } });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Open sign-out from the habitat." }, { status: 403, headers });
  return Response.json({ ok: true }, { headers: { ...headers, "Set-Cookie": await ownerCookie(request, true) } });
}
