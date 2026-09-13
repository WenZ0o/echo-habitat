export type ResidentId = "moss" | "lux" | "echo";
export type Place = "grove" | "pool" | "observatory";
export type Intervention = "rain" | "relic" | "blackout";
export type MemoryKind = "origin" | "encounter" | "discovery" | "environment" | "building";
export type Resource = "biomass" | "salvage" | "insight";
export type BlueprintId = "garden" | "solar" | "lookout" | "cistern" | "workshop" | "bridge";
export type ConstructionPhase = "foundation" | "frame" | "finishing";

export interface Position { x: number; y: number }
export interface ConstructionProject {
  blueprint: BlueprintId;
  district: number;
  startedAt: number;
  work: number;
  contributions: Record<ResidentId, number>;
}
export interface CouncilDecision {
  id: string;
  tick: number;
  district: number;
  candidates: BlueprintId[];
  votes: Record<ResidentId, BlueprintId>;
  chosen: BlueprintId;
  summary: string;
}
export interface Settlement {
  resources: Record<Resource, number>;
  built: Record<BlueprintId, number>;
  project: ConstructionProject | null;
  decision: CouncilDecision | null;
}
export interface Memory { id: string; tick: number; text: string; kind: MemoryKind }
export interface Resident {
  id: ResidentId;
  location: Place;
  position: Position;
  energy: number;
  mood: number;
  progress: number;
  thought: string;
  activity: string;
  memories: Memory[];
  bonds: Record<ResidentId, number>;
}
export interface ChronicleEntry {
  id: string;
  tick: number;
  actor: ResidentId | "world";
  title: string;
  text: string;
  kind: MemoryKind;
}
export interface World {
  version: 3;
  tick: number;
  seed: number;
  lastActiveAt: number;
  power: number;
  growth: number;
  discoveries: number;
  totalMemories: number;
  weather: "clear" | "rain";
  intervention: { kind: Intervention; remaining: number } | null;
  residents: Resident[];
  chronicle: ChronicleEntry[];
  settlement: Settlement;
}
export type LegacyWorld = Omit<World, "version" | "settlement" | "lastActiveAt" | "residents"> & {
  version: 1;
  residents: Array<Omit<Resident, "position">>;
};
export type LegacyWorldV2 = Omit<World, "version" | "lastActiveAt" | "residents" | "settlement"> & {
  version: 2;
  residents: Array<Omit<Resident, "position">>;
  settlement: Omit<Settlement, "decision">;
};
export interface OfflineSummary {
  elapsedMs: number;
  steps: number;
  fromTick: number;
  toTick: number;
  structuresBuilt: number;
  decisionsMade: number;
  highlights: ChronicleEntry[];
}
export interface WorldResponse {
  world: World;
  revision: number;
  offline?: OfflineSummary;
  mode?: "owner" | "visitor";
}
export type WorldAction = { type: "step" } | { type: "event"; event: Intervention } | { type: "reset" };
