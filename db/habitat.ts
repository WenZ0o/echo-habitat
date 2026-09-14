import { habitatStore } from "@/db/storage-driver";
import type { Snapshot } from "./storage-types";
import { advanceOffline, createWorld, evolveWorld, pendingSteps, upgradeWorld } from "@/lib/habitat/engine";
import type { WorldAction, WorldResponse } from "@/lib/habitat/types";

async function snapshot(now: number) { return await habitatStore.read() ?? await habitatStore.initialize(createWorld(4173, now)); }

function response(saved: Snapshot, now: number): WorldResponse {
  const world = upgradeWorld(saved.world, now);
  return { world, revision: saved.revision, pendingSteps: pendingSteps(world, now) };
}

async function synchronize(now: number, limit?: number) {
  let current = await snapshot(now);
  for (let attempt = 0; attempt < 5; attempt++) {
    const { world, summary } = advanceOffline(current.world, now, limit);
    if (!summary && current.world.version === 4) return current;
    const saved = await habitatStore.compareAndSwap(current, world);
    if (saved) return saved;
    current = await snapshot(now);
  }
if (current.world.version !== 4) {
  throw new Error(
    "HABITAT_MIGRATION_NOT_SAVED: Save upgrade failed after 5 attempts."
  );
}
return current;
}

export async function readHabitat(now = Date.now(), limit?: number): Promise<WorldResponse> {
  return response(await synchronize(now, limit), now);
}

export async function updateHabitat(action: WorldAction, actionRevision: number, now = Date.now()) {
  let current = await synchronize(now);
  for (let attempt = 0; attempt < 5; attempt++) {
    const previous = upgradeWorld(current.world, now);
    if (previous.actionRevision !== actionRevision) return { conflict: true, ...response(current, now) };
    if (pendingSteps(previous, now) > 0 && action.type !== "reset") {
      throw new Error("The habitat is catching up. Wait a moment before changing its clock or introducing an event.");
    }
    const world = evolveWorld(previous, action);
    world.actionRevision = previous.actionRevision + 1;
    if (action.type === "reset") world.epoch = now;
    // Clock changes and manual steps begin a fresh interval. Idle time while paused is ignored.
    world.lastActiveAt = now;
    const saved = await habitatStore.compareAndSwap(current, world);
    if (saved) return { conflict: false, ...response(saved, now) };
    current = await synchronize(now);
  }
  return { conflict: true, ...response(current, now) };
}
