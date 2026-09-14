import type { OfflineSummary, World } from "./types";

export interface LastVisit { at: number; epoch: number; tick: number; structures: number; decisions: number }
export const VISIT_KEY = "echo-habitat:last-visit:v4";
export function visitMarker(world: World, at: number): LastVisit {
  return { at, epoch: world.epoch, tick: world.tick, structures: Object.values(world.settlement.built).reduce((a, b) => a + b, 0), decisions: world.councilsMade };
}
export function parseVisit(json: string | null): LastVisit | null {
  try {
    const value = JSON.parse(json ?? "null");
    return value && ["at", "epoch", "tick", "structures", "decisions"].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0) ? value : null;
  } catch { return null; }
}
export function summarizeVisit(before: LastVisit | null, world: World, now: number): OfflineSummary | null {
  if (!before || before.epoch !== world.epoch || now - before.at < 60000 || world.tick <= before.tick) return null;
  const after = visitMarker(world, now);
  return {
    elapsedMs: now - before.at, steps: world.tick - before.tick, fromTick: before.tick, toTick: world.tick,
    structuresBuilt: Math.max(0, after.structures - before.structures), decisionsMade: Math.max(0, after.decisions - before.decisions),
    highlights: world.chronicle.filter(entry => entry.tick > before.tick && (entry.title.includes("made together") || entry.actor === "world" || entry.kind === "discovery")).slice(0, 5),
  };
}
