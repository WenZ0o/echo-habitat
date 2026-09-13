import { env } from "cloudflare:workers";
import { createWorld, evolveWorld, upgradeWorld } from "@/lib/habitat/engine";
import type { LegacyWorld, World, WorldAction, WorldResponse } from "@/lib/habitat/types";
function connection() {
  if (!env.DB) throw new Error("Habitat storage is unavailable.");
  return env.DB;
}
export async function readHabitat(): Promise<WorldResponse> {
  const db = connection();
  await db.prepare("INSERT OR IGNORE INTO habitats (id, state, revision) VALUES (?, ?, 0)")
    .bind("main", JSON.stringify(createWorld())).run();
  const row = await db.prepare("SELECT state, revision FROM habitats WHERE id = ?").bind("main")
    .first<{ state: string; revision: number }>();
  if (!row) throw new Error("The habitat could not be loaded.");
  return { world: upgradeWorld(JSON.parse(row.state) as World | LegacyWorld), revision: row.revision };
}
export async function updateHabitat(action: WorldAction, revision: number) {
  const current = await readHabitat();
  if (current.revision !== revision) return { conflict: true as const, ...current };
  const world = evolveWorld(current.world, action);
  const result = await connection().prepare("UPDATE habitats SET state = ?, revision = revision + 1 WHERE id = ? AND revision = ?")
    .bind(JSON.stringify(world), "main", revision).run();
  if (result.meta.changes !== 1) return { conflict: true as const, ...await readHabitat() };
  return { conflict: false as const, world, revision: revision + 1 };
}
