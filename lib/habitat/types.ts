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
  reasons?: Record<ResidentId, string>;
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
  district: number;
  carrying: Resource | null;
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
  version: 4;
  epoch: number;
  tick: number;
  seed: number;
  lastActiveAt: number;
  clock: { running: boolean; speed: 1 | 2 | 4 };
  actionRevision: number;
  councilsMade: number;
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
type LegacyBase = Omit<World, "version" | "settlement" | "lastActiveAt" | "residents" | "clock" | "actionRevision" | "councilsMade" | "epoch">;
type LegacyResident = Omit<Resident, "position" | "district" | "carrying">;
export type LegacyWorld = LegacyBase & {
  version: 1;
  residents: LegacyResident[];
};
export type LegacyWorldV2 = LegacyBase & {
  version: 2;
  lastActiveAt?: number;
  residents: LegacyResident[];
  settlement: Omit<Settlement, "decision">;
};
export type LegacyWorldV3 = LegacyBase & {
  version: 3;
  lastActiveAt: number;
  residents: Array<LegacyResident & { position: Position }>;
  settlement: Settlement;
};
export type StoredWorld = World | LegacyWorld | LegacyWorldV2 | LegacyWorldV3;
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
  access?: { canSignIn: boolean; signInUrl?: string };
  pendingSteps?: number;
}
export type WorldAction = { type: "step" } | { type: "event"; event: Intervention } | { type: "reset" } | { type: "playback"; running: boolean; speed: 1 | 2 | 4 };
