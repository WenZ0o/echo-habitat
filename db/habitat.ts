import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { advanceOffline, createWorld, evolveWorld, upgradeWorld } from "@/lib/habitat/engine";
import type { LegacyWorld, LegacyWorldV2, World, WorldAction, WorldResponse } from "@/lib/habitat/types";

type StoredWorld = World | LegacyWorld | LegacyWorldV2;
type StoredHabitat = { world: StoredWorld; revision: number };
type Snapshot = StoredHabitat & { etag: string };

const HABITAT_PATH = "echo-habitat/world.json";

function serialize(world: World, revision: number) {
  return JSON.stringify({ world, revision });
}

async function readExisting(): Promise<Snapshot | null> {
  const result = await get(HABITAT_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const parsed = JSON.parse(await new Response(result.stream).text()) as StoredHabitat;
  if (!parsed || typeof parsed.revision !== "number" || !parsed.world) {
    throw new Error("The habitat store contains invalid data.");
  }
  return { ...parsed, etag: result.blob.etag };
}

async function createInitial(now: number): Promise<Snapshot> {
  const world = createWorld(4173, now);
  try {
    const blob = await put(HABITAT_PATH, serialize(world, 0), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return { world, revision: 0, etag: blob.etag };
  } catch {
    // Another request may have initialized the habitat at the same time.
    const existing = await readExisting();
    if (existing) return existing;
    throw new Error("The habitat store could not be initialized.");
  }
}

async function readSnapshot(now: number): Promise<Snapshot> {
  return (await readExisting()) ?? createInitial(now);
}

async function replaceSnapshot(snapshot: Snapshot, world: World, revision: number) {
  return put(HABITAT_PATH, serialize(world, revision), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    ifMatch: snapshot.etag,
    contentType: "application/json",
  });
}

async function synchronize(now: number): Promise<{ world: World; revision: number; etag: string; offline?: WorldResponse["offline"] }> {
  let snapshot = await readSnapshot(now);

  for (let attempt = 0; attempt < 2; attempt++) {
    const upgraded = upgradeWorld(snapshot.world, now);
    const { world, summary } = advanceOffline(upgraded, now);
    if (!summary) return { world, revision: snapshot.revision, etag: snapshot.etag };

    try {
      const revision = snapshot.revision + 1;
      const blob = await replaceSnapshot(snapshot, world, revision);
      return { world, revision, etag: blob.etag, offline: summary };
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) throw error;
      snapshot = await readSnapshot(now);
    }
  }

  const latest = await readSnapshot(now);
  return { world: upgradeWorld(latest.world, now), revision: latest.revision, etag: latest.etag };
}

export async function readHabitat(now = Date.now()): Promise<WorldResponse> {
  const { world, revision, offline } = await synchronize(now);
  return offline ? { world, revision, offline } : { world, revision };
}

export async function updateHabitat(action: WorldAction, revision: number, now = Date.now()) {
  let current = await synchronize(now);
  if (current.revision !== revision) {
    return { conflict: true as const, world: current.world, revision: current.revision, offline: current.offline };
  }

  // A private Blob conditional write can lose a very small race between a fresh read
  // and the following PUT. If the logical revision is still unchanged, refresh the
  // ETag and retry the same action once instead of unnecessarily pausing the habitat.
  for (let attempt = 0; attempt < 2; attempt++) {
    const world = evolveWorld(current.world, action);
    world.lastActiveAt = now;

    try {
      await replaceSnapshot(current, world, revision + 1);
      return { conflict: false as const, world, revision: revision + 1 };
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) throw error;
      current = await synchronize(now);
      if (current.revision !== revision) {
        return { conflict: true as const, world: current.world, revision: current.revision, offline: current.offline };
      }
    }
  }

  return { conflict: true as const, ...await readHabitat(now) };
}
