export type ResidentId = "moss" | "lux" | "echo";
export type Place = "grove" | "pool" | "observatory";
export type Intervention = "rain" | "relic" | "blackout";
export type MemoryKind = "origin" | "encounter" | "discovery" | "environment" | "building";
export type Resource = "biomass" | "salvage" | "insight";
export type BlueprintId = "garden" | "solar" | "lookout" | "cistern" | "workshop" | "bridge";
export interface ConstructionProject {
  blueprint: BlueprintId; district: number; startedAt: number; work: number;
  contributions: Record<ResidentId, number>;
}
export interface Settlement {
  resources: Record<Resource, number>;
  built: Record<BlueprintId, number>;
  project: ConstructionProject | null;
}
export interface Memory { id: string; tick: number; text: string; kind: MemoryKind }
export interface Resident {
  id: ResidentId; location: Place; energy: number; mood: number; progress: number;
  thought: string; activity: string; memories: Memory[]; bonds: Record<ResidentId, number>;
}
export interface ChronicleEntry {
  id: string; tick: number; actor: ResidentId | "world"; title: string; text: string; kind: MemoryKind;
}
export interface World {
  version: 2; tick: number; seed: number; power: number; growth: number; discoveries: number;
  totalMemories: number; weather: "clear" | "rain";
  intervention: { kind: Intervention; remaining: number } | null;
  residents: Resident[]; chronicle: ChronicleEntry[];
  settlement: Settlement;
}
export type LegacyWorld = Omit<World, "version" | "settlement"> & { version: 1 };
export interface WorldResponse { world: World; revision: number }
export type WorldAction = { type: "step" } | { type: "event"; event: Intervention } | { type: "reset" };
