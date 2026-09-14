import { env } from "cloudflare:workers";
import type { HabitatStore } from "./storage-types";

type Row = { state: string; revision: number };
function database() {
  if (!env.DB) throw new Error("The habitat database is unavailable.");
  return env.DB;
}
export const habitatStore: HabitatStore = {
  async read() {
    const row = await database().prepare("SELECT state, revision FROM habitats WHERE id = ?").bind("main").first<Row>();
    return row ? { world: JSON.parse(row.state), revision: row.revision, etag: String(row.revision) } : null;
  },
  async initialize(world) {
    await database().prepare("INSERT OR IGNORE INTO habitats (id, state, revision) VALUES (?, ?, 0)").bind("main", JSON.stringify(world)).run();
    const snapshot = await habitatStore.read();
    if (!snapshot) throw new Error("Could not initialize the habitat.");
    return snapshot;
  },
  async compareAndSwap(before, world) {
    const revision = before.revision + 1;
    const result = await database().prepare("UPDATE habitats SET state = ?, revision = ? WHERE id = ? AND revision = ?")
      .bind(JSON.stringify(world), revision, "main", before.revision).run();
    return result.meta.changes === 1 ? { world, revision, etag: String(revision) } : null;
  },
};
