import type { StoredWorld, World } from "@/lib/habitat/types";

export interface Snapshot { world: StoredWorld; revision: number; etag: string }
export interface HabitatStore {
  read(): Promise<Snapshot | null>;
  initialize(world: World): Promise<Snapshot>;
  compareAndSwap(before: Snapshot, world: World): Promise<Snapshot | null>;
}
