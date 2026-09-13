import type { BlueprintId, Place, ResidentId, Resource, Settlement, World } from "./types";

export interface Blueprint {
  id: BlueprintId; name: string; lead: ResidentId; place: Place;
  description: string; benefit: string; cost: Record<Resource, number>; work: number;
  x: number; y: number;
}
export const BLUEPRINTS: Blueprint[] = [
  { id: "garden", name: "Living garden", lead: "moss", place: "grove", work: 14,
    description: "A patch of bare ground becomes a place for new roots.", benefit: "Restores growth each cycle",
    cost: { biomass: 12, salvage: 4, insight: 0 }, x: 46, y: 65 },
  { id: "solar", name: "Sun terrace", lead: "lux", place: "observatory", work: 18,
    description: "Salvaged panels turn the daylight into a little more independence.", benefit: "Restores power each cycle",
    cost: { biomass: 4, salvage: 16, insight: 3 }, x: 71, y: 67 },
  { id: "lookout", name: "Lookout", lead: "echo", place: "grove", work: 18,
    description: "From a little higher up, unfamiliar land comes into view.", benefit: "More insight from exploration",
    cost: { biomass: 10, salvage: 8, insight: 10 }, x: 27, y: 40 },
  { id: "cistern", name: "Rain collector", lead: "moss", place: "pool", work: 20,
    description: "They find a way to keep a little of the rain for a clear day.", benefit: "More biomass from gathering",
    cost: { biomass: 16, salvage: 12, insight: 6 }, x: 24, y: 65 },
  { id: "workshop", name: "Shared workshop", lead: "lux", place: "observatory", work: 22,
    description: "A place to turn the things they find into the things they need.", benefit: "More salvage from gathering",
    cost: { biomass: 12, salvage: 22, insight: 10 }, x: 82, y: 57 },
  { id: "bridge", name: "Bridge outward", lead: "echo", place: "observatory", work: 26,
    description: "The edge of their world becomes the beginning of another.", benefit: "Opens the next district",
    cost: { biomass: 24, salvage: 20, insight: 18 }, x: 86, y: 42 },
];
export const RESOURCES: Record<Resource, { name: string; lead: ResidentId }> = {
  biomass: { name: "Biomass", lead: "moss" },
  salvage: { name: "Salvage", lead: "lux" },
  insight: { name: "Insight", lead: "echo" },
};
export const RESOURCE_IDS: Resource[] = ["biomass", "salvage", "insight"];
export const RESOURCE_CAP = 250;
export function createSettlement(): Settlement {
  return { resources: { biomass: 8, salvage: 6, insight: 2 },
    built: { garden: 0, solar: 0, lookout: 0, cistern: 0, workshop: 0, bridge: 0 }, project: null };
}
export function districtOf(world: World) { return Math.min(...Object.values(world.settlement.built)) + 1; }
export function nextBlueprint(world: World): Blueprint {
  const district = districtOf(world);
  return BLUEPRINTS.find(blueprint => world.settlement.built[blueprint.id] < district)!;
}
export function blueprintCost(blueprint: Blueprint, district: number): Record<Resource, number> {
  const scale = 1 + Math.min(district - 1, 5) * 0.3;
  return { biomass: Math.ceil(blueprint.cost.biomass * scale), salvage: Math.ceil(blueprint.cost.salvage * scale), insight: Math.ceil(blueprint.cost.insight * scale) };
}
export function workRequired(blueprint: Blueprint, district: number) { return blueprint.work + Math.min(district - 1, 8) * 3; }
export function addResource(world: World, resource: Resource, amount: number) {
  world.settlement.resources[resource] = Math.min(RESOURCE_CAP, world.settlement.resources[resource] + amount);
}
