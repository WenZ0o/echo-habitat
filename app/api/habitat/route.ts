import { z } from "zod";
import { readHabitat, updateHabitat } from "@/db/habitat";
const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("step") }).strict(),
  z.object({ type: z.literal("event"), event: z.enum(["rain", "relic", "blackout"]) }).strict(),
  z.object({ type: z.literal("reset") }).strict(),
]);
const requestSchema = z.object({ revision: z.number().int().nonnegative(), action: actionSchema }).strict();
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try { return Response.json(await readHabitat(), { headers }); }
  catch (error) {
    console.error("Habitat read failed", error);
    return Response.json({ error: "The habitat could not be loaded. Please try again." }, { status: 503, headers });
  }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return Response.json({ error: "This action must come from the habitat." }, { status: 403, headers });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Expected a JSON action." }, { status: 415, headers });
  }
  const body = await request.text();
  if (body.length > 2048) return Response.json({ error: "Action is too large." }, { status: 413, headers });
  let parsed;
  try { parsed = requestSchema.safeParse(JSON.parse(body)); }
  catch { return Response.json({ error: "Invalid action." }, { status: 400, headers }); }
  if (!parsed.success) return Response.json({ error: "Invalid action." }, { status: 400, headers });
  try {
    const result = await updateHabitat(parsed.data.action, parsed.data.revision);
    return Response.json(result, { status: result.conflict ? 409 : 200, headers });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Wait for")) {
      return Response.json({ error: error.message }, { status: 422, headers });
    }
    console.error("Habitat save failed", error);
    return Response.json({ error: "Your change could not be saved. The habitat is paused; try again." }, { status: 503, headers });
  }
}
