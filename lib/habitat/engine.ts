import { EVENT_LABELS, PLACES, PROFILES, RESIDENT_IDS } from "./residents";
import { addResource, BLUEPRINTS, blueprintCost, createSettlement, districtOf, nextBlueprint, RESOURCE_CAP, RESOURCE_IDS, RESOURCES, workRequired } from "./construction";
import type { ChronicleEntry, LegacyWorld, MemoryKind, Place, Resident, Resource, World, WorldAction } from "./types";
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function createWorld(seed = 4173): World {
  const thoughts = { moss: "There is room here for something to take root.",
    lux: "Someone left the lights on. I think I can keep them that way.",
    echo: "The water remembers a sky I have never seen." };
  return {
    version: 2, tick: 0, seed, power: 84, growth: 62, discoveries: 0, totalMemories: 3,
    weather: "clear", intervention: null, settlement: createSettlement(),
    residents: RESIDENT_IDS.map((id, index) => ({
      id, location: PROFILES[id].home, energy: 88 - index * 7, mood: 78 + index * 3,
      progress: 0, thought: thoughts[id],
      activity: ["Tending the grove", "Checking the lights", "Watching the water"][index],
      memories: [{ id: `${id}-origin`, tick: 0, text: thoughts[id], kind: "origin" }],
      bonds: { moss: 50, lux: 50, echo: 50 },
    })),
    chronicle: [{ id: "world-origin", tick: 0, actor: "world", title: "A small beginning",
      text: "Moss, Lux and Echo wake in the habitat. The rest of their story is unwritten.", kind: "origin" }],
  };
}
// Version 1 saves keep every resident, memory, bond and clock value. New fields
// are persisted atomically on the next action, under the existing revision check.
export function upgradeWorld(saved: World | LegacyWorld): World {
  if (saved.version === 2) return saved;
  if (saved.version !== 1) throw new Error("This habitat save uses an unsupported version.");
  return { ...saved, version: 2, settlement: createSettlement() };
}
function random(world: World) {
  let x = world.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  world.seed = x >>> 0 || 4173; return world.seed / 4294967296;
}
function record(world: World, entry: Omit<ChronicleEntry, "id" | "tick">) {
  world.chronicle.unshift({ ...entry, tick: world.tick,
    id: `t${world.tick}-${world.chronicle.filter(e => e.tick === world.tick).length}-${entry.actor}` });
  world.chronicle = world.chronicle.slice(0, 240);
}
function remember(world: World, resident: Resident, text: string, kind: MemoryKind) {
  resident.memories.unshift({ id: `m${world.tick}-${world.totalMemories}`, tick: world.tick, text, kind });
  resident.memories = resident.memories.slice(0, 80); world.totalMemories += 1;
}
function bond(a: Resident, b: Resident, amount: number) {
  a.bonds[b.id] = clamp(a.bonds[b.id] + amount); b.bonds[a.id] = a.bonds[b.id];
}
function planConstruction(world: World) {
  if (world.settlement.project || world.intervention?.kind === "blackout") return;
  const blueprint = nextBlueprint(world), district = districtOf(world), cost = blueprintCost(blueprint, district);
  if (!RESOURCE_IDS.every(resource => world.settlement.resources[resource] >= cost[resource])) return;
  for (const resource of RESOURCE_IDS) world.settlement.resources[resource] -= cost[resource];
  world.settlement.project = { blueprint: blueprint.id, district, startedAt: world.tick, work: 0, contributions: { moss: 0, lux: 0, echo: 0 } };
  record(world, { actor: blueprint.lead, title: `A plan for ${blueprint.name.toLowerCase()}`,
    text: `${PROFILES[blueprint.lead].name} lays out a plan in district ${district}. Materials are set aside; all three can help build it.`, kind: "building" });
}
function buildOrGather(world: World, resident: Resident): boolean {
  // Every fourth cycle remains open for encounters, exploration and maintenance.
  if (world.tick % 4 === 0) return false;
  const project = world.settlement.project;
  if (project) {
    const blueprint = BLUEPRINTS.find(b => b.id === project.blueprint)!;
    const amount = Math.min(resident.id === blueprint.lead ? 2 : 1, workRequired(blueprint, project.district) - project.work);
    if (amount <= 0) return false;
    project.work += amount; project.contributions[resident.id] += amount;
    resident.location = blueprint.place; resident.energy = clamp(resident.energy - 2); resident.progress += 1;
    resident.activity = `Building ${blueprint.name.toLowerCase()}`;
    resident.thought = resident.id === blueprint.lead
      ? `I can see it now: ${blueprint.name.toLowerCase()}. Something we will leave here together.`
      : `I am helping ${PROFILES[blueprint.lead].name}. This place is becoming ours, one piece at a time.`;
    record(world, { actor: resident.id, title: resident.activity,
      text: `${PROFILES[resident.id].name} contributes ${amount} work in district ${project.district}. ${project.work} of ${workRequired(blueprint, project.district)} work is complete.`, kind: "building" });
    return true;
  }
  const resource: Resource = resident.id === "moss" ? "biomass" : resident.id === "lux" ? "salvage" : "insight";
  const bonus = resident.id === "moss" ? world.settlement.built.cistern : resident.id === "lux" ? world.settlement.built.workshop : world.settlement.built.lookout;
  const amount = (resident.id === "echo" ? 3 : 4) + Math.min(3, bonus);
  const before = world.settlement.resources[resource];
  if (before >= RESOURCE_CAP) return false;
  addResource(world, resource, amount);
  resident.location = PROFILES[resident.id].home; resident.progress += 1;
  resident.activity = { moss: "Gathering seeds and fibres", lux: "Recovering useful parts", echo: "Mapping unfamiliar ground" }[resident.id];
  resident.thought = { moss: "A few seeds, a little care. Enough for another beginning.", lux: "This is not broken. It just has not found its next purpose yet.", echo: "Beyond the roots, there is more room than I thought." }[resident.id];
  if (resident.id === "echo") world.discoveries += 1;
  record(world, { actor: resident.id, title: resident.activity,
    text: `${PROFILES[resident.id].name} adds ${world.settlement.resources[resource] - before} ${RESOURCES[resource].name.toLowerCase()} to the shared stores for ${nextBlueprint(world).name.toLowerCase()}.`, kind: "building" });
  return true;
}
function finishConstruction(world: World) {
  const project = world.settlement.project;
  if (!project) return;
  const blueprint = BLUEPRINTS.find(b => b.id === project.blueprint)!;
  if (project.work < workRequired(blueprint, project.district)) return;
  world.settlement.built[blueprint.id] += 1;
  world.settlement.project = null;
  const text = `${blueprint.name} is complete in district ${project.district}. ${blueprint.benefit}.`;
  record(world, { actor: blueprint.lead, title: `${blueprint.name}, made together`, text, kind: "building" });
  for (const resident of world.residents) {
    resident.mood = clamp(resident.mood + 8);
    remember(world, resident, `${text} I remember the day we made it together.`, "building");
    for (const other of world.residents) if (resident.id < other.id && project.contributions[resident.id] && project.contributions[other.id]) bond(resident, other, 5);
  }
  if (blueprint.id === "bridge") record(world, { actor: "world", title: `District ${districtOf(world)} is within reach`,
    text: "The bridge opens another place to settle. Moss, Lux and Echo begin gathering for a new garden; the building cycle continues.", kind: "building" });
}
function decide(world: World, resident: Resident) {
  const profile = PROFILES[resident.id], roll = random(world);
  resident.energy = clamp(resident.energy - 3);
  if (resident.energy < 24) {
    resident.location = "pool"; resident.energy = clamp(resident.energy + 27);
    resident.mood = clamp(resident.mood + 4); resident.activity = "Taking a quiet moment";
    resident.thought = "I do not have to make something happen every moment.";
    record(world, { actor: resident.id, title: "A moment to rest", text: `${profile.name} rests beside the pool and recovers energy.`, kind: "environment" });
    return;
  }
  if (world.power < 45 && resident.id === "lux") {
    resident.location = "observatory"; world.power = clamp(world.power + 22); resident.progress += 1;
    resident.activity = "Restoring the power";
    resident.thought = "One connection at a time. They are counting on this light.";
    remember(world, resident, "The station went dark. I found the fault and brought some of the light back.", "discovery");
    record(world, { actor: resident.id, title: "A light comes back", text: "Lux repairs a damaged circuit. Habitat power rises by 22 points.", kind: "discovery" });
    return;
  }
  if (world.intervention?.kind === "blackout" && resident.id !== "lux") {
    const lux = world.residents.find(r => r.id === "lux")!;
    resident.location = "observatory"; bond(resident, lux, 5);
    resident.mood = clamp(resident.mood + (world.power > 40 ? 5 : -2));
    resident.activity = "Keeping Lux company";
    resident.thought = "The dark is less strange when someone else is here.";
    remember(world, resident, "When the lights failed, I stayed with Lux. We kept each other steady.", "encounter");
    record(world, { actor: resident.id, title: "Nobody alone in the dark", text: `${profile.name} joins Lux at the observatory. Their bond grows.`, kind: "encounter" });
    return;
  }
  if (world.intervention?.kind === "relic" && resident.id === "echo") {
    resident.location = "observatory"; resident.activity = "Studying the unknown object";
    const observations = [
      "There is a spiral inside it. The same shape as the roots beneath the grove.",
      "It makes a soft note when the light touches it. Maybe it was meant to be found.",
      "Someone carved three marks into the edge. Three, just like us.",
      "It is warm now. I think it has been collecting the sunlight all this time.",
    ];
    resident.thought = observations[Math.max(0, Math.min(3, 4 - world.intervention.remaining))];
    world.discoveries += 1; resident.progress += 1; resident.mood = clamp(resident.mood + 6);
    addResource(world, "insight", 5);
    remember(world, resident, resident.thought, "discovery");
    record(world, { actor: resident.id, title: "A new piece of the story", text: resident.thought, kind: "discovery" });
    return;
  }
  if (world.weather === "rain" && resident.id === "moss") {
    resident.location = "grove"; resident.activity = "Welcoming the rain";
    resident.thought = "Listen. Every leaf has its own way of catching the rain.";
    world.growth = clamp(world.growth + 7); resident.mood = clamp(resident.mood + 5); resident.progress += 1;
    addResource(world, "biomass", 6);
    remember(world, resident, "Rain reached the roots today. New shoots appeared beneath the old tree.", "environment");
    record(world, { actor: resident.id, title: "Something takes root", text: "Moss guides rainwater toward the new shoots. Growth rises by 7 points.", kind: "environment" });
    return;
  }
  if (buildOrGather(world, resident)) return;
  const other = world.residents.find(r => r.id !== resident.id && r.location === resident.location);
  if (other && roll < 0.5) {
    const trusted = resident.bonds[other.id] >= 70;
    bond(resident, other, 4); resident.mood = clamp(resident.mood + 5);
    resident.activity = `Spending time with ${PROFILES[other.id].name}`;
    const sharedMemory = other.memories.find(m => m.kind === "discovery");
    resident.thought = sharedMemory ? `${PROFILES[other.id].name} told me: “${sharedMemory.text}”`
      : trusted ? `I know the sound of ${PROFILES[other.id].name}'s footsteps now. It feels like home.`
      : `I asked ${PROFILES[other.id].name} what they notice first when they wake up.`;
    remember(world, resident, resident.thought, "encounter");
    remember(world, other, `${profile.name} stayed to listen to me at ${PLACES[resident.location].name.toLowerCase()}.`, "encounter");
    record(world, { actor: resident.id, title: trusted ? "A familiar kind of quiet" : "A little less like strangers",
      text: `${profile.name} and ${PROFILES[other.id].name} share a moment at ${PLACES[resident.location].name.toLowerCase()}.`, kind: "encounter" });
    return;
  }
  if (roll > 0.63) {
    const places: Place[] = ["grove", "pool", "observatory"], next = places.filter(p => p !== resident.location);
    resident.location = next[Math.floor(random(world) * next.length)];
    resident.activity = `Exploring ${PLACES[resident.location].name.toLowerCase()}`;
    resident.thought = resident.memories.length > 4 ? "This place feels different from the first time. Or maybe I do." : "I wonder who else has stood right here.";
    record(world, { actor: resident.id, title: "A change of scenery", text: `${profile.name} wanders to ${PLACES[resident.location].name.toLowerCase()}.`, kind: "environment" });
    return;
  }
  resident.location = profile.home; resident.progress += 1; resident.mood = clamp(resident.mood + 1);
  if (resident.id === "moss") {
    world.growth = clamp(world.growth + 3); resident.activity = "Tending the grove";
    resident.thought = ["Small things grow, even when nobody is watching.", "I left a little shade by the pool. Someone might need it.", "These roots are finding their way. So am I."][world.tick % 3];
  } else if (resident.id === "lux") {
    world.power = clamp(world.power + 5); resident.activity = "Maintaining the observatory";
    resident.thought = ["A warm light makes even an unfamiliar room feel kinder.", "I fixed the hum in the wall. I almost miss it.", "Maybe I should build something just because it is beautiful."][world.tick % 3];
  } else {
    resident.activity = "Following a small curiosity";
    resident.thought = ["The reflections are never exactly the same twice.", "Moss names the plants. I think I will name the silences.", "There is a pattern here. I just need to look a little longer."][world.tick % 3];
    if (world.tick % 4 === 0) world.discoveries += 1;
  }
  if (world.tick % 3 === 0) remember(world, resident, resident.thought, resident.id === "echo" ? "discovery" : "environment");
  record(world, { actor: resident.id, title: resident.activity, text: resident.thought, kind: resident.id === "echo" ? "discovery" : "environment" });
}
export function evolveWorld(previous: World | LegacyWorld, action: WorldAction): World {
  if (action.type === "reset") return createWorld();
  const world = structuredClone(upgradeWorld(previous));
  world.tick += 1;
  world.power = clamp(world.power - 3 + Math.min(3, world.settlement.built.solar));
  world.growth = clamp(world.growth - 1 + Math.min(2, world.settlement.built.garden));
  if (action.type === "event") {
    if (world.intervention) throw new Error("Wait for the current event to settle before introducing another.");
    world.intervention = { kind: action.event, remaining: 4 };
    if (action.event === "rain") world.weather = "rain";
    if (action.event === "blackout") world.power = 12;
    const descriptions = { rain: "Rain falls through the dome. The habitat begins to respond.",
      relic: "An unfamiliar object appears near the observatory. Echo notices it first.",
      blackout: "The station's power is interrupted. The residents must find their own way through." };
    record(world, { actor: "world", title: EVENT_LABELS[action.event], text: descriptions[action.event], kind: "environment" });
    for (const resident of world.residents) remember(world, resident, descriptions[action.event], "environment");
  }
  planConstruction(world);
  for (const resident of world.residents) decide(world, resident);
  finishConstruction(world);
  if (world.intervention) {
    world.intervention.remaining -= 1;
    if (world.intervention.remaining <= 0) {
      const was = world.intervention.kind; world.intervention = null; world.weather = "clear";
      record(world, { actor: "world", title: "A new kind of normal", text: was === "rain"
        ? "The rain passes. The roots hold on to what it brought."
        : was === "relic" ? "The object becomes part of the habitat's story. Its discoveries live on in memory."
        : "The interruption ends. Whatever the residents learned stays with them.", kind: "environment" });
    }
  }
  return world;
}
