import { readHabitat } from "@/db/habitat";
import { setting } from "@/db/runtime";
import { equalSecret } from "@/lib/habitat/access";

export const maxDuration = 60;
export async function GET(request: Request) {
  const secret = setting("CRON_SECRET");
  if (secret.length < 32 || !await equalSecret(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await readHabitat(Date.now(), 60000);
    return Response.json({ tick: result.world.tick, pendingSteps: result.pendingSteps }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The habitat could not be synchronized." }, { status: 503 });
  }
}
