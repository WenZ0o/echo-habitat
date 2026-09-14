import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import type { HabitatStore, Snapshot } from "./storage-types";

const path = "echo-habitat/world.json";

const options = {
  access: "private" as const,
  addRandomSuffix: false,
  contentType: "application/json",
};

export const habitatStore: HabitatStore = {
  async read() {
const result = await get(path, {
  access: "private",
  useCache: false,
  headers: {
    "Accept-Encoding": "identity",
  },
});

    if (!result) return null;

    if (result.statusCode !== 200 || !result.stream) {
      throw new Error("Habitat storage returned an incomplete response.");
    }

    const saved = JSON.parse(await new Response(result.stream).text());

    if (
      !Number.isSafeInteger(saved?.revision) ||
      saved.revision < 0 ||
      !saved.world
    ) {
      throw new Error("Invalid habitat save.");
    }

    return {
      world: saved.world,
      revision: saved.revision,
      etag: result.blob.etag,
    } satisfies Snapshot;
  },

  async initialize(world) {
    try {
      const blob = await put(
        path,
        JSON.stringify({ world, revision: 0 }),
        options,
      );

      return { world, revision: 0, etag: blob.etag };
    } catch (error) {
      const winner = await habitatStore.read();
      if (winner) return winner;
      throw error;
    }
  },

  async compareAndSwap(before, world): Promise<Snapshot | null> {
    const revision = before.revision + 1;

    try {
      const blob = await put(
        path,
        JSON.stringify({ world, revision }),
        {
          ...options,
          allowOverwrite: true,
          ifMatch: before.etag,
        },
      );

      return { world, revision, etag: blob.etag };
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) {
        console.error("HABITAT_WRITE_CONFLICT", {
          revision: before.revision,
          savedVersion: before.world.version,
          etagPresent:
            typeof before.etag === "string" &&
            before.etag.length > 0,
          etagWeak:
            typeof before.etag === "string" &&
            before.etag.startsWith("W/"),
        });

        return null;
      }

      throw error;
    }
  },
};
