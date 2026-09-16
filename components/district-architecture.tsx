import type { CSSProperties } from "react";
import type { BlueprintId } from "@/lib/habitat/types";
import { biome, BIOMES } from "./island-terrain";

export type DistrictStructure = {
  name: string;
  description: string;
  functionalRole: string;
};

type DistrictArchitecture = {
  title: string;
  style: string;
  description: string;
  structures: Record<BlueprintId, DistrictStructure>;
};

const ARCHITECTURES: DistrictArchitecture[] = [
  {
    title: "The Canopy Settlement",
    style: "living timber · woven glass · root foundations",
    description: "Rooms grow around trunks and roots instead of replacing them. Paths rise into the canopy and every roof is shared with the forest.",
    structures: {
      garden: { name: "Root Nursery", description: "A sheltered nursery woven into the oldest roots.", functionalRole: "growth" },
      solar: { name: "Sunleaf Array", description: "Thin collectors open above the canopy like broad leaves.", functionalRole: "power" },
      lookout: { name: "Canopy Watch", description: "A high platform hidden between the crowns of the Elder Tree.", functionalRole: "insight" },
      cistern: { name: "Rain Nest", description: "Leaf funnels guide rain into a suspended clear-water chamber.", functionalRole: "water" },
      workshop: { name: "Living Atelier", description: "A curved timber workshop built around, never through, the forest.", functionalRole: "salvage" },
      bridge: { name: "Vine Span", description: "A living suspension path reaches toward the next island.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Mesa Enclave",
    style: "sandstone · copper · sun-cut terraces",
    description: "Architecture is carved into the plateau so the settlement looks excavated from the same stone as the island itself.",
    structures: {
      garden: { name: "Terrace Orchard", description: "Deep planters cut into cool sandstone shelves.", functionalRole: "growth" },
      solar: { name: "Heliostat Court", description: "Copper mirrors track the sun from a protected stone court.", functionalRole: "power" },
      lookout: { name: "Cliff Beacon", description: "A narrow beacon rises from the highest mesa edge.", functionalRole: "insight" },
      cistern: { name: "Stone Cistern", description: "A shaded reservoir holds precious water beneath the plateau.", functionalRole: "water" },
      workshop: { name: "Mesa Forge", description: "A low, heavy workshop vents heat through carved stone chimneys.", functionalRole: "salvage" },
      bridge: { name: "Canyon Causeway", description: "A stepped causeway crosses open air like an ancient road.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Lagoon Commons",
    style: "pale timber · glass membranes · tidal platforms",
    description: "Buildings barely touch the land. Most rooms stand above the lagoon on slender piles and glow softly after dark.",
    structures: {
      garden: { name: "Tide Garden", description: "Floating beds turn shallow water into a living food garden.", functionalRole: "growth" },
      solar: { name: "Luminous Sailfield", description: "Translucent energy sails follow the arc of the sun and moon.", functionalRole: "power" },
      lookout: { name: "Lagoon Lantern", description: "A tall lantern tower marks the safe channel through the reef.", functionalRole: "insight" },
      cistern: { name: "Moonwell", description: "A silvered basin filters rain and tidal condensation.", functionalRole: "water" },
      workshop: { name: "Stilt Atelier", description: "A workshop on piles opens directly onto the lagoon.", functionalRole: "salvage" },
      bridge: { name: "Reef Walk", description: "A low illuminated walkway threads between sandbars and reef.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Reclaimed Sanctuary",
    style: "weathered stone · bronze repairs · new green growth",
    description: "Nothing is demolished. New rooms occupy broken halls, old walls become foundations and every repair remains visibly newer than the ruin around it.",
    structures: {
      garden: { name: "Restored Cloister", description: "An abandoned courtyard becomes a sheltered garden again.", functionalRole: "growth" },
      solar: { name: "Sun Court", description: "Reflective panels sit inside the footprint of a lost ceremonial court.", functionalRole: "power" },
      lookout: { name: "Archive Tower", description: "A repaired watchtower stores maps as well as offering a view.", functionalRole: "insight" },
      cistern: { name: "Sacred Basin", description: "An ancient basin is sealed and returned to service.", functionalRole: "water" },
      workshop: { name: "Relic Foundry", description: "Recovered fragments are catalogued, repaired and reused here.", functionalRole: "salvage" },
      bridge: { name: "Reclaimed Aqueduct", description: "A broken aqueduct becomes the route into the next district.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Basalt Hold",
    style: "black stone · smoked glass · pale metal",
    description: "Low angular buildings lock into the volcanic rock. Light appears only in narrow seams, making the settlement feel cut from one continuous dark mass.",
    structures: {
      garden: { name: "Ash Garden", description: "Mineral-rich beds shelter new growth from the wind.", functionalRole: "growth" },
      solar: { name: "Heat Mirror", description: "Dark thermal plates collect both sun and stored volcanic warmth.", functionalRole: "power" },
      lookout: { name: "Obsidian Watch", description: "A blade-thin watchtower grows from the cliff edge.", functionalRole: "insight" },
      cistern: { name: "Deep Reservoir", description: "Water is protected inside a cool fracture in the basalt.", functionalRole: "water" },
      workshop: { name: "Blackglass Forge", description: "A compact forge works salvage beside the island's natural heat.", functionalRole: "salvage" },
      bridge: { name: "Basalt Span", description: "A dark ribbed bridge extends from the Crown like another rock shelf.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Water Terraces",
    style: "light timber · lime plaster · stepped roofs",
    description: "The settlement follows the contour lines of the fields. Water, footpaths and roofs descend together in deliberate horizontal layers.",
    structures: {
      garden: { name: "Seed Terrace", description: "A nursery terrace keeps the next planting above the waterline.", functionalRole: "growth" },
      solar: { name: "Sun Gate", description: "A broad gate carries energy panels over the upper terrace.", functionalRole: "power" },
      lookout: { name: "Field Bell Tower", description: "A slender timber tower watches both weather and water flow.", functionalRole: "insight" },
      cistern: { name: "Water Stair", description: "A sequence of stepped basins slows, filters and stores rain.", functionalRole: "water" },
      workshop: { name: "Craft House", description: "A long shared house combines repair benches and storage.", functionalRole: "salvage" },
      bridge: { name: "Irrigation Walk", description: "A narrow crossing continues the geometry of the terraces outward.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Prism Station",
    style: "mineral ribs · translucent glass · cool alloy",
    description: "Buildings use the crystal field as structure and light source. They read less like houses and more like precise instruments grown into the rock.",
    structures: {
      garden: { name: "Prism Garden", description: "Low glass beds use refracted light to support delicate growth.", functionalRole: "growth" },
      solar: { name: "Light Harvester", description: "Faceted collectors split and redirect light throughout the station.", functionalRole: "power" },
      lookout: { name: "Facet Observatory", description: "A crystalline observatory turns distant movement into sharp reflections.", functionalRole: "insight" },
      cistern: { name: "Crystal Well", description: "Condensation gathers along a cool mineral spine into a clear reservoir.", functionalRole: "water" },
      workshop: { name: "Resonance Lab", description: "A precise workshop studies and shapes recovered mineral material.", functionalRole: "salvage" },
      bridge: { name: "Prism Bridge", description: "A narrow translucent crossing catches the light between islands.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Wind Garden",
    style: "slender timber · tension cable · sail cloth",
    description: "Almost every surface moves. Roofs vent, collectors turn and suspended paths flex so the settlement works with the constant wind instead of resisting it.",
    structures: {
      garden: { name: "Prairie Nursery", description: "Low windbreaks protect young plants without closing off the horizon.", functionalRole: "growth" },
      solar: { name: "Wind Harps", description: "Vertical energy sails turn the prevailing wind into power.", functionalRole: "power" },
      lookout: { name: "Sky Lookout", description: "A feather-light mast watches weather approaching over open water.", functionalRole: "insight" },
      cistern: { name: "Dew Collector", description: "Fine mesh wings gather moisture from the night air.", functionalRole: "water" },
      workshop: { name: "Kite Workshop", description: "An open-sided repair hall doubles as a rigging shed.", functionalRole: "salvage" },
      bridge: { name: "Suspension Walk", description: "A cable path crosses the gap with almost no structure beneath it.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Tidal Sanctuary",
    style: "old masonry · sea glass · floating walkways",
    description: "The settlement accepts that half the island belongs to the tide. New construction bridges dry ruins and flooded chambers instead of trying to push the water away.",
    structures: {
      garden: { name: "Tidal Conservatory", description: "Salt-tolerant beds occupy the sheltered edge of a flooded hall.", functionalRole: "growth" },
      solar: { name: "Mirror Array", description: "Floating mirrors direct light into the darker sanctuary interior.", functionalRole: "power" },
      lookout: { name: "Temple Beacon", description: "A beacon stands on the highest surviving piece of the temple.", functionalRole: "insight" },
      cistern: { name: "Flood Vault", description: "A sealed chamber separates fresh water from the surrounding tide.", functionalRole: "water" },
      workshop: { name: "Salvage Hall", description: "Recovered material is washed, sorted and repaired above the water.", functionalRole: "salvage" },
      bridge: { name: "Causeway of Tides", description: "A modular crossing rises just above the changing sea level.", functionalRole: "expansion" },
    },
  },
  {
    title: "The Ember Colony",
    style: "charred timber · dark ceramic · warm glass",
    description: "New growth and black earth are treated as equal materials. Warm windows and ember-colored greenhouse membranes make the colony glow from within.",
    structures: {
      garden: { name: "Ember Garden", description: "Dark soil beds surround heat-loving luminous plants.", functionalRole: "growth" },
      solar: { name: "Thermal Petals", description: "Petal-shaped collectors harvest sunlight and retained ground heat.", functionalRole: "power" },
      lookout: { name: "Cinder Watch", description: "A dark observation tower carries a single warm beacon.", functionalRole: "insight" },
      cistern: { name: "Condensation Vault", description: "Warm vapor cools against ceramic fins and runs into a buried tank.", functionalRole: "water" },
      workshop: { name: "Bloom Forge", description: "A compact workshop combines repair benches with a heat chamber.", functionalRole: "salvage" },
      bridge: { name: "Charcoal Bridge", description: "A black timber bridge is stitched together with pale metal braces.", functionalRole: "expansion" },
    },
  },
];

const ROLE_NAMES: Record<BlueprintId, string> = {
  garden: "Nursery", solar: "Powerworks", lookout: "Observatory", cistern: "Reservoir", workshop: "Atelier", bridge: "Crossing",
};
const ROLE_FUNCTIONS: Record<BlueprintId, string> = {
  garden: "growth", solar: "power", lookout: "insight", cistern: "water", workshop: "salvage", bridge: "expansion",
};

export function districtArchitecture(district: number): DistrictArchitecture {
  const index = Math.max(1, district) - 1;
  if (index < ARCHITECTURES.length) return ARCHITECTURES[index];
  const base = ARCHITECTURES[index % ARCHITECTURES.length];
  const code = String(index + 1).padStart(2, "0");
  return {
    title: `The Frontier Assembly ${code}`,
    style: `${base.style} · frontier ${code}`,
    description: `District ${code} develops a one-off frontier architecture from the same material world without reusing another district's named structures.`,
    structures: Object.fromEntries((Object.keys(ROLE_NAMES) as BlueprintId[]).map(id => [id, {
      name: `${ROLE_NAMES[id]} ${code}`,
      description: `A district-${code} ${ROLE_NAMES[id].toLowerCase()} with a globally unique visible structure recipe.`,
      functionalRole: ROLE_FUNCTIONS[id],
    }])) as Record<BlueprintId, DistrictStructure>,
  };
}

export function districtStructure(id: BlueprintId, district: number) {
  return districtArchitecture(district).structures[id];
}

function roleGeometry(id: BlueprintId) {
  if (id === "garden") return { width: 62, height: 34, tower: 0 };
  if (id === "solar") return { width: 68, height: 42, tower: 0 };
  if (id === "lookout") return { width: 38, height: 68, tower: 1 };
  if (id === "cistern") return { width: 58, height: 36, tower: 0 };
  if (id === "workshop") return { width: 70, height: 48, tower: 0 };
  return { width: 82, height: 28, tower: 0 };
}

export function DistrictStructureArt({ id, district, progress = 100, className = "" }: {
  id: BlueprintId;
  district: number;
  progress?: number;
  className?: string;
}) {
  const family = (Math.max(1, district) - 1) % BIOMES.length;
  const b = biome(district);
  const role = roleGeometry(id);
  const builtOpacity = .38 + Math.min(100, Math.max(0, progress)) / 100 * .62;
  const css = { "--architecture-accent": b.accent, "--architecture-edge": b.edge } as CSSProperties;
  const roofY = 58 - role.height * .48;
  const left = 50 - role.width / 2;
  const right = 50 + role.width / 2;

  return <svg className={`district-structure-art architecture-${family} role-${id} ${className}`} viewBox="0 0 100 100" aria-hidden="true" style={css}>
    <ellipse cx="50" cy="82" rx={Math.min(43, role.width * .58)} ry="8" fill="#09120f" opacity=".25"/>
    <g opacity={builtOpacity}>
      {family === 0 && <>
        <path d={`M${left + 8} 70Q50 ${roofY - 14} ${right - 8} 70`} fill="none" stroke="#735c42" strokeWidth="7" strokeLinecap="round"/>
        <path d={`M${left + 4} 66Q50 ${roofY - 7} ${right - 4} 66L${right - 10} 77H${left + 10}Z`} fill="#2f5942" stroke="#9fbe81" strokeWidth="2"/>
        <path d="M50 69V32" stroke="#6c573d" strokeWidth={id === "lookout" ? 7 : 4}/>
        <circle cx="50" cy={id === "lookout" ? 24 : 38} r={id === "lookout" ? 11 : 7} fill="#84a66a" stroke="#d3d89c" strokeWidth="2"/>
        <path d="M35 76Q50 83 65 76" fill="none" stroke="#5b8a68" strokeWidth="3"/>
      </>}
      {family === 1 && <>
        <path d={`M${left + 6} 75L${left + 13} ${roofY + 9}L${right - 12} ${roofY + 3}L${right - 4} 75Z`} fill="#82563f" stroke="#e0b77e" strokeWidth="2"/>
        <path d={`M${left + 14} ${roofY + 14}H${right - 14}M${left + 10} ${roofY + 25}H${right - 9}`} stroke="#b97c51" strokeWidth="3"/>
        {id === "solar" && <><path d="M26 37L47 31L49 47L28 53Z" fill="#6c7771" stroke="#e7c58f"/><path d="M53 31L74 37L72 53L51 47Z" fill="#6c7771" stroke="#e7c58f"/></>}
        {id === "lookout" && <path d="M46 57L48 15L55 10L58 58Z" fill="#6b473a" stroke="#efc486" strokeWidth="2"/>}
      </>}
      {family === 2 && <>
        <path d={`M${left + 7} 75V${roofY + 16}Q50 ${roofY - 5} ${right - 7} ${roofY + 16}V75Z`} fill="#d7d2ad" stroke="#f0e9c8" strokeWidth="1.8"/>
        <path d={`M${left + 3} ${roofY + 20}Q50 ${roofY - 12} ${right - 3} ${roofY + 20}`} fill="none" stroke="#7cc1b6" strokeWidth="5"/>
        <path d="M33 75V84M50 73V86M67 75V84" stroke="#9b8968" strokeWidth="2.5"/>
        {id === "solar" && <path d="M24 42Q50 23 76 42Q50 35 24 42Z" fill="#8ac8c4" stroke="#e7efcf" strokeWidth="2"/>}
        {id === "bridge" && <path d="M10 68Q50 49 90 68" fill="none" stroke="#dcd5b1" strokeWidth="6"/>}
      </>}
      {family === 3 && <>
        <path d={`M${left + 7} 76V${roofY + 13}H${right - 7}V76Z`} fill="#777c66" stroke="#c9cbb1" strokeWidth="2"/>
        <path d={`M${left + 13} 76V${roofY + 22}Q${left + 13} ${roofY + 8} ${left + 25} ${roofY + 8}Q${left + 37} ${roofY + 8} ${left + 37} ${roofY + 22}V76`} fill="none" stroke="#b6b99e" strokeWidth="4"/>
        <path d={`M${right - 20} 76V${roofY + 3}M${right - 27} ${roofY + 4}H${right - 12}`} stroke="#d2c99d" strokeWidth="4"/>
        <path d="M30 68L25 75M71 61L78 70" stroke="#587357" strokeWidth="4"/>
      </>}
      {family === 4 && <>
        <path d={`M${left + 7} 76L${left + 15} ${roofY + 8}L50 ${roofY - 4}L${right - 14} ${roofY + 10}L${right - 5} 76Z`} fill="#28383a" stroke="#89a99d" strokeWidth="2"/>
        <path d={`M${left + 20} 66L50 ${roofY + 5}L${right - 18} 66`} fill="none" stroke="#a9c1b4" strokeWidth="2" opacity=".6"/>
        {id === "lookout" && <path d="M46 66L48 14L54 6L58 66Z" fill="#223136" stroke="#a0bdb3" strokeWidth="2"/>}
        <path d="M39 69H61" stroke="#d4e0c8" strokeWidth="2" opacity=".7"/>
      </>}
      {family === 5 && <>
        <path d={`M${left + 6} 74H${right - 6}L${right - 13} ${roofY + 18}H${left + 13}Z`} fill="#d5c996" stroke="#f0e4b2" strokeWidth="2"/>
        <path d={`M${left + 12} ${roofY + 18}H${right - 12}M${left + 17} ${roofY + 9}H${right - 17}M${left + 22} ${roofY}H${right - 22}`} stroke="#70825a" strokeWidth="4"/>
        <path d="M50 40V76" stroke="#7c6447" strokeWidth={id === "lookout" ? 5 : 3}/>
        {id === "bridge" && <path d="M12 69H88" stroke="#d8cda0" strokeWidth="5" strokeDasharray="9 3"/>}
      </>}
      {family === 6 && <>
        <path d={`M${left + 10} 76L${left + 20} ${roofY + 6}L43 ${roofY - 8}L50 ${roofY + 2}L60 ${roofY - 13}L${right - 12} 76Z`} fill="#718da8" stroke="#cae0e7" strokeWidth="2"/>
        <path d="M43 63L50 39L58 66M34 69L42 52M67 70L61 48" fill="none" stroke="#d8f2ef" strokeWidth="2" opacity=".7"/>
        {id === "solar" && <circle cx="50" cy="40" r="13" fill="#a5d9de" opacity=".55" stroke="#e8f5e9" strokeWidth="2"/>}
      </>}
      {family === 7 && <>
        <path d={`M${left + 10} 76V${roofY + 18}H${right - 12}V76Z`} fill="#c8c39a" stroke="#ece5c1" strokeWidth="2"/>
        <path d={`M${left + 3} ${roofY + 22}Q50 ${roofY - 7} ${right - 3} ${roofY + 22}`} fill="none" stroke="#788e6f" strokeWidth="4"/>
        <path d="M50 70V28" stroke="#715f45" strokeWidth="3"/>
        <path d="M50 30Q31 38 27 51Q42 47 50 36Q67 43 76 54Q69 37 50 30Z" fill="#e2dbb6" opacity=".85"/>
        {id === "solar" && <path d="M50 34L50 12M50 22L36 16M50 22L64 16" stroke="#d9d4b1" strokeWidth="3"/>}
      </>}
      {family === 8 && <>
        <path d={`M${left + 8} 76H${right - 8}L${right - 17} ${roofY + 13}H${left + 17}Z`} fill="#69766c" stroke="#bcc8a7" strokeWidth="2"/>
        <path d={`M${left + 15} ${roofY + 14}V${roofY}H${right - 15}V${roofY + 14}`} fill="none" stroke="#d1d5b4" strokeWidth="4"/>
        <path d="M22 79Q50 89 78 79" fill="none" stroke="#5ca6a3" strokeWidth="6" opacity=".8"/>
        <path d="M31 74V84M69 74V84" stroke="#8f8468" strokeWidth="2"/>
      </>}
      {family === 9 && <>
        <path d={`M${left + 7} 76Q${left + 13} ${roofY + 4} 50 ${roofY + 2}Q${right - 13} ${roofY + 4} ${right - 7} 76Z`} fill="#403c39" stroke="#a49f82" strokeWidth="2"/>
        <path d={`M${left + 15} 69Q50 ${roofY - 8} ${right - 15} 69`} fill="none" stroke="#d4774f" strokeWidth="4"/>
        <path d="M40 69H60" stroke="#f0a06e" strokeWidth="2" opacity=".75"/>
        {id === "garden" && <><circle cx="38" cy="57" r="5" fill="#b85d43"/><circle cx="51" cy="52" r="6" fill="#d9784e"/><circle cx="63" cy="59" r="5" fill="#a94f40"/></>}
        {id === "lookout" && <path d="M47 66L48 18L53 10L57 66Z" fill="#3a3938" stroke="#d4865b" strokeWidth="2"/>}
      </>}

      {id === "garden" && family !== 9 && <g fill={b.accent} opacity=".75"><circle cx="34" cy="69" r="3"/><circle cx="43" cy="65" r="2.5"/><circle cx="64" cy="68" r="3"/></g>}
      {id === "cistern" && <ellipse cx="50" cy="72" rx="17" ry="6" fill={b.water} stroke={b.edge} strokeWidth="2" opacity=".85"/>}
      {id === "workshop" && <path d="M68 52V35M68 35L73 31" stroke={b.accent} strokeWidth="3" strokeLinecap="round"/>}
      {id === "bridge" && family !== 2 && family !== 5 && <path d="M12 71Q50 52 88 71" fill="none" stroke={b.edge} strokeWidth="5" strokeLinecap="round"/>}
    </g>
    {progress < 100 && <path d="M13 90H87" stroke="#d8c982" strokeWidth="2" opacity=".45" strokeDasharray="5 4"/>}
  </svg>;
}