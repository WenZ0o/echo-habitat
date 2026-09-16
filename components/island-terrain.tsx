import { memo, useId } from "react";
import { BLUEPRINTS } from "@/lib/habitat/construction";
import type { BlueprintId, Position } from "@/lib/habitat/types";

export const BUILDING_ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];

type IslandShape = "canopy" | "mesa" | "crescent" | "ruins" | "crown" | "terraces" | "crystal" | "windswept" | "sanctuary" | "caldera";
export type IslandBiome = {
  name: string;
  shortName: string;
  landmark: string;
  mood: string;
  ground: string;
  ground2: string;
  edge: string;
  rock: string;
  shadow: string;
  accent: string;
  water: string;
  glass: string;
  warm: string;
  shape: IslandShape;
};

/* One civilization, many districts. Topography changes; the material language does not. */
export const BIOMES: IslandBiome[] = [
  { name: "Verdant Canopy", shortName: "Canopy", landmark: "The Elder Tree", mood: "An old grove protected beneath a living glass canopy", ground: "#52694c", ground2: "#31483c", edge: "#9aae82", rock: "#2c3d37", shadow: "#15231f", accent: "#c8d292", water: "#5b9187", glass: "#b4d1c4", warm: "#d8bd78", shape: "canopy" },
  { name: "Amber Mesa", shortName: "Mesa", landmark: "The Sun Pillar", mood: "Weathered terraces inhabited by the same quiet machine ecology", ground: "#626f54", ground2: "#414d40", edge: "#a8ad82", rock: "#3f3d35", shadow: "#201f1b", accent: "#c4ba87", water: "#657f78", glass: "#b8cdbd", warm: "#d4aa70", shape: "mesa" },
  { name: "Moonlit Lagoon", shortName: "Lagoon", landmark: "The Moon Pool", mood: "A sheltered water city holding pale light under glass", ground: "#526c5d", ground2: "#344e47", edge: "#a7b99a", rock: "#2e4140", shadow: "#172726", accent: "#bdcca4", water: "#5b9992", glass: "#b8d6cc", warm: "#d0b77c", shape: "crescent" },
  { name: "Ancient Ruins", shortName: "Ruins", landmark: "The Broken Gate", mood: "Old masonry absorbed into a new machine settlement", ground: "#5e6952", ground2: "#3d4a3f", edge: "#a7af8e", rock: "#3a403b", shadow: "#1e2622", accent: "#c2c091", water: "#607f76", glass: "#b0c7b9", warm: "#d2b477", shape: "ruins" },
  { name: "Basalt Crown", shortName: "Basalt", landmark: "The Obsidian Spire", mood: "Dark mineral shelves threaded with warm inhabited light", ground: "#4b5d50", ground2: "#30423e", edge: "#879d81", rock: "#293334", shadow: "#131d1c", accent: "#afbe93", water: "#4d7470", glass: "#a3c2ba", warm: "#cba970", shape: "crown" },
  { name: "Rice Terraces", shortName: "Terraces", landmark: "The Water Shrine", mood: "Stepped gardens, water and habitation moving as one system", ground: "#64764e", ground2: "#405444", edge: "#acba82", rock: "#37433b", shadow: "#1c2a24", accent: "#c9cd8f", water: "#679890", glass: "#b7cdbb", warm: "#d1b875", shape: "terraces" },
  { name: "Crystal Crags", shortName: "Crags", landmark: "The Glass Heart", mood: "Mineral ribs carrying light between the settlement's cores", ground: "#56665d", ground2: "#384943", edge: "#a3b3a4", rock: "#30383a", shadow: "#181f20", accent: "#bac7a5", water: "#5a817d", glass: "#c1d8cf", warm: "#cfb173", shape: "crystal" },
  { name: "Wind Gardens", shortName: "Wind", landmark: "The Wind Arch", mood: "Low gardens and flexible machine structures beneath a wide canopy", ground: "#607057", ground2: "#3e5045", edge: "#a8b68e", rock: "#36413c", shadow: "#1b2824", accent: "#c2c998", water: "#648982", glass: "#b3cdc3", warm: "#d0b67b", shape: "windswept" },
  { name: "Sunken Sanctuary", shortName: "Sanctuary", landmark: "The Drowned Temple", mood: "Half-flooded stone chambers reclaimed as luminous living rooms", ground: "#53695e", ground2: "#344c47", edge: "#9fb39a", rock: "#34413e", shadow: "#182624", accent: "#bec89a", water: "#518c88", glass: "#b3d3ca", warm: "#ceb078", shape: "sanctuary" },
  { name: "Ashen Bloom", shortName: "Bloom", landmark: "The Ember Tree", mood: "Dark earth carrying new growth and a warm machine colony", ground: "#555d4d", ground2: "#3c443c", edge: "#9ca681", rock: "#323634", shadow: "#1a201e", accent: "#c0b989", water: "#5b7773", glass: "#acc8be", warm: "#cf9d6d", shape: "caldera" },
];

export function biome(district: number) {
  return BIOMES[(Math.max(1, district) - 1) % BIOMES.length];
}

export function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function buildingPosition(id: BlueprintId, district: number) {
  const index = BUILDING_ORDER.indexOf(id);
  const b = biome(district);
  const rotation = b.shape === "crescent" ? 2 : b.shape === "mesa" ? 1 : b.shape === "terraces" ? 3 : b.shape === "crown" ? 4 : (district - 1) % 5;
  const target = index === 5 ? 5 : (index + rotation) % 5;
  return BLUEPRINTS.find(item => item.id === BUILDING_ORDER[target])!;
}

export function residentPosition(position: Position, district: number) {
  if (!district) return position;
  const nearest = BLUEPRINTS.reduce((best, item) =>
    Math.hypot(item.x - position.x, item.y - position.y) < Math.hypot(best.x - position.x, best.y - position.y) ? item : best);
  const target = buildingPosition(nearest.id, district);
  return { x: position.x + target.x - nearest.x, y: position.y + target.y - nearest.y };
}

function shapeRadius(shape: IslandShape, angle: number, district: number, index: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const jitter = .972 + noise(district * 41 + index * 3) * .052;
  if (shape === "crescent") return jitter * (c > .43 ? .8 : 1.025);
  if (shape === "mesa") return jitter * (.988 + Math.cos(angle * 4) * .018);
  if (shape === "crown") return jitter * (.958 + Math.sin(angle * 5 + .8) * .055);
  if (shape === "terraces") return jitter * (1 + Math.cos(angle * 2) * .038);
  if (shape === "crystal") return jitter * (.958 + Math.abs(Math.sin(angle * 3)) * .05);
  if (shape === "windswept") return jitter * (c < -.3 ? 1.06 : .973);
  if (shape === "sanctuary") return jitter * (s > .5 && c > -.2 ? .84 : 1.012);
  if (shape === "caldera") return jitter * (.983 + Math.sin(angle * 4 + .6) * .03);
  if (shape === "ruins") return jitter * (.982 + Math.cos(angle * 3) * .024);
  return jitter * (1 + Math.sin(angle * 3 + district) * .018);
}

export function islandOutlinePoints(district: number) {
  const b = biome(district);
  return Array.from({ length: 36 }, (_, i) => {
    const angle = i / 36 * Math.PI * 2;
    const radius = shapeRadius(b.shape, angle, district, i);
    const wide = b.shape === "windswept" ? 137 : b.shape === "terraces" ? 140 : 133;
    const high = b.shape === "crown" || b.shape === "crystal" ? 49 : 47;
    return { x: 150 + Math.cos(angle) * wide * radius, y: 93 + Math.sin(angle) * high * radius };
  });
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 12C-1 5 0-3 2-12" stroke="#554937" strokeWidth="2.4" strokeLinecap="round"/>
    <ellipse cx="0" cy="-15" rx="8" ry="6" fill="#49684f"/>
    <ellipse cx="-6" cy="-11" rx="6.5" ry="5.2" fill="#365844"/>
    <ellipse cx="7" cy="-11" rx="6.2" ry="5" fill="#5d785d"/>
    <ellipse cx="1" cy="-19" rx="4.8" ry="3.4" fill="#829573" opacity=".56"/>
  </g>;
}

function Landmark({ district }: { district: number }) {
  const family = (district - 1) % BIOMES.length;
  const b = biome(district);
  if (family === 0) return <g transform="translate(151 71)"><path d="M0 27C-4 8-2-11 2-30M0-2l-21-15M1-10l20-17" stroke="#65523d" strokeWidth="5.2" strokeLinecap="round"/><ellipse cy="-33" rx="26" ry="15" fill="#355944"/><ellipse cx="-19" cy="-24" rx="17" ry="12" fill="#45694e"/><ellipse cx="20" cy="-25" rx="18" ry="12" fill="#5a7b59"/><circle cx="0" cy="-42" r="3" fill={b.warm} opacity=".65"/></g>;
  if (family === 1) return <g transform="translate(151 74)"><path d="M-12 23L-6-30 4-42 13 23Z" fill="#504d45" stroke={b.edge} strokeWidth="1.8"/><path d="M-4-24L7-29M-8-3L10-9M-9 14L11 9" stroke={b.warm} strokeWidth="1.5" opacity=".68"/></g>;
  if (family === 2) return <g><ellipse cx="151" cy="84" rx="35" ry="18" fill={b.water} stroke={b.edge} strokeWidth="3"/><ellipse cx="151" cy="82" rx="23" ry="10" fill={b.glass} opacity=".24"/><ellipse cx="151" cy="82" rx="10" ry="5" fill={b.warm} opacity=".18"/></g>;
  if (family === 3) return <g fill="none" stroke="#a9af91" strokeWidth="4.2"><path d="M127 95V63Q127 42 151 42Q175 42 175 63V95"/><path d="M137 95V65Q137 54 151 54Q165 54 165 65V95" strokeWidth="2.2"/><path d="M116 96H187" stroke="#59635a" strokeWidth="4"/></g>;
  if (family === 4) return <g transform="translate(151 77)"><path d="M-11 20L-5-27 2-42 10-15 15 20Z" fill="#273333" stroke="#849d93" strokeWidth="1.7"/><path d="M2-36V9" stroke={b.warm} strokeWidth="1.3" opacity=".58"/></g>;
  if (family === 5) return <g transform="translate(151 81)"><path d="M-23 15H23L15-8H-16Z" fill="#5d6553" stroke="#b6b98b" strokeWidth="1.8"/><path d="M-11-7V-21M11-7V-21M-15-21H15" stroke="#c7bf8b" strokeWidth="3"/><path d="M-28 17Q0 28 29 17" fill="none" stroke={b.water} strokeWidth="4"/></g>;
  if (family === 6) return <g transform="translate(151 78)"><path d="M-16 18L-7-30 0-43 7-18 16 18Z" fill="#70847d" stroke="#bbcdc4" strokeWidth="1.8"/><path d="M-3 13L0-37M6-16L11 15" stroke="#d8e7df" strokeWidth="1.2" opacity=".55"/></g>;
  if (family === 7) return <g transform="translate(151 76)" fill="none" stroke="#beb993" strokeWidth="4.5" strokeLinecap="round"><path d="M-26 21Q-24-16 0-16Q24-16 26 21"/><path d="M-14 21Q-12-6 0-6Q12-6 14 21" strokeWidth="2.2"/></g>;
  if (family === 8) return <g transform="translate(151 84)"><path d="M-29 10H29L20-14H-20Z" fill="#4e5d56" stroke="#99a88e" strokeWidth="1.8"/><path d="M-16-13V-30H16V-13M-4-30V-39H5V-30" fill="none" stroke="#b0b694" strokeWidth="3"/><path d="M-34 13Q0 24 35 12" fill="none" stroke={b.water} strokeWidth="5" opacity=".72"/></g>;
  return <g transform="translate(151 73)"><path d="M0 23C-4 7-2-10 1-24M0-7l-16-11M1-11l17-13" stroke="#52433b" strokeWidth="4.2" strokeLinecap="round"/><ellipse cy="-28" rx="18" ry="11" fill="#665445"/><ellipse cx="-14" cy="-21" rx="12" ry="9" fill="#7c654d"/><ellipse cx="14" cy="-22" rx="12" ry="9" fill="#936c4e"/><circle cx="0" cy="-32" r="3" fill={b.warm} opacity=".68"/></g>;
}

function Scenery({ district }: { district: number }) {
  const family = (district - 1) % BIOMES.length;
  const b = biome(district);
  if (family === 0) return <g>{Array.from({ length: 17 }, (_, i) => <Tree key={i} x={38 + noise(district * 13 + i) * 224} y={74 + noise(district * 23 + i) * 43} scale={.45 + noise(i + district) * .31}/>)}</g>;
  if (family === 1) return <g fill="none" stroke="#8e8064" opacity=".5"><path d="M35 79Q83 62 120 70M42 91Q83 77 120 83M185 72Q226 61 265 79M190 87Q229 75 258 89" strokeWidth="2.2"/><path d="M57 106Q151 82 243 106" stroke="#45443c" strokeWidth="4"/></g>;
  if (family === 2) return <g><path d="M31 99Q66 73 110 81Q97 102 112 117Q68 123 35 110Z" fill={b.water} opacity=".62"/><path d="M190 80Q231 70 268 94Q247 119 203 116Q214 95 190 80Z" fill={b.water} opacity=".55"/>{[47,75,226,250].map((x,i)=><Tree key={i} x={x} y={101+i%2*8} scale={.5}/>)}</g>;
  if (family === 3) return <g stroke="#818978" fill="none" opacity=".6"><path d="M43 106V78H71V95M216 106V71H247V93M78 104H107V84H123" strokeWidth="3"/><path d="M37 112H126M194 112H263" strokeWidth="2"/></g>;
  if (family === 4) return <g fill="#34413f" stroke="#677a72" strokeWidth="1"><path d="M41 109l15-35 17 35zM74 117l16-28 16 28zM217 106l17-40 19 40zM190 116l12-28 15 28z"/></g>;
  if (family === 5) return <g fill="none" strokeWidth="4" opacity=".68"><path d="M28 80Q72 56 117 62" stroke="#b5b88d"/><path d="M33 91Q76 68 119 73" stroke="#5f7857"/><path d="M38 102Q78 80 120 84" stroke="#8fa36f"/><path d="M182 87Q226 69 269 78" stroke="#b4b88e"/><path d="M180 99Q224 82 263 90" stroke="#5a7354"/><path d="M179 110Q221 96 258 101" stroke="#8da06d"/></g>;
  if (family === 6) return <g stroke="#aebfb8" strokeWidth="1">{[{x:54,y:104,h:27},{x:87,y:116,h:18},{x:218,y:103,h:31},{x:244,y:116,h:20},{x:196,y:79,h:18}].map((p,i)=><path key={i} d={`M${p.x-7} ${p.y}l4 -${p.h} 8 -6 7 ${p.h}-8 9Z`} fill={i%2 ? "#5f706c" : "#71827d"}/>)}</g>;
  if (family === 7) return <g>{Array.from({ length: 14 }, (_, i) => { const x=38+noise(district*17+i)*224,y=91+noise(district*31+i)*31; return <g key={i} transform={`translate(${x} ${y})`}><path d="M0 7Q-3-1-1-10" stroke="#50634f" strokeWidth="1.2"/><path d="M-1-6q7-4 11-1q-6 4-11 3" fill="#879b73" opacity=".65"/></g>; })}</g>;
  if (family === 8) return <g><path d="M34 96Q72 74 109 81Q97 102 113 117Q70 122 38 112Z" fill={b.water} opacity=".57"/><path d="M193 81Q230 74 264 94Q248 115 204 114Q215 96 193 81Z" fill={b.water} opacity=".6"/><path d="M55 114h47M206 118h41" stroke="#7c8f78" strokeWidth="3"/></g>;
  return <g><ellipse cx="151" cy="95" rx="54" ry="20" fill="#303835" opacity=".55"/><ellipse cx="151" cy="95" rx="31" ry="10" fill="#202824" opacity=".62"/></g>;
}

function CityInfrastructure({ district }: { district: number }) {
  const b = biome(district);
  const pods = Array.from({ length: 7 }, (_, i) => {
    const seed = district * 151 + i * 37;
    const side = i < 4 ? -1 : 1;
    return {
      x: 150 + side * (40 + noise(seed) * 70),
      y: 88 + noise(seed + 3) * 31,
      h: 8 + noise(seed + 7) * 13,
      w: 7 + noise(seed + 11) * 9,
    };
  });
  return <g className="terrain-city-infrastructure">
    <path d="M62 112Q103 93 137 103Q153 108 172 100Q205 86 239 108" fill="none" stroke={b.glass} strokeWidth=".75" strokeDasharray="2 4" opacity=".48"/>
    <path d="M86 124Q116 109 151 111Q190 111 219 126" fill="none" stroke={b.edge} strokeWidth=".65" strokeDasharray="1 5" opacity=".34"/>
    {pods.map((pod, i) => <g key={i} transform={`translate(${pod.x} ${pod.y})`}>
      <ellipse cy="4" rx={pod.w * .72} ry="2.8" fill="#15231f" opacity=".72"/>
      <path d={`M${-pod.w/2} 3Q0 ${-pod.h} ${pod.w/2} 3Z`} fill="#496258" stroke={b.glass} strokeWidth=".7" opacity=".92"/>
      <path d={`M${-pod.w*.34} 1Q0 ${-pod.h*.72} ${pod.w*.34} 1`} fill="none" stroke="#dbe8dc" strokeWidth=".45" opacity=".42"/>
      <circle cy={-pod.h * .42} r="1.25" fill={i % 3 === 0 ? b.warm : b.glass} opacity=".88" className="terrain-city-light"/>
    </g>)}
    <g transform="translate(151 98)">
      <ellipse cy="7" rx="23" ry="6" fill="#17251f" opacity=".78"/>
      <path d="M-20 6Q-14-19 0-24Q14-19 20 6Z" fill="#415c52" stroke={b.glass} strokeWidth="1.1" opacity=".95"/>
      <path d="M-14 5Q-9-13 0-17Q9-13 14 5" fill="none" stroke="#dce8dd" strokeWidth=".6" opacity=".45"/>
      <ellipse cy="4" rx="8" ry="3" fill={b.warm} opacity=".18"/>
      <circle cy="-8" r="2.1" fill={b.warm} className="terrain-city-light core-light"/>
      <path d="M0-25V-39" stroke={b.glass} strokeWidth="1" opacity=".55"/>
      <circle cy="-41" r="1.5" fill={b.warm} className="terrain-city-light"/>
    </g>
  </g>;
}

function HabitatCanopy({ district }: { district: number }) {
  const b = biome(district);
  const shift = (noise(district * 91) - .5) * 10;
  return <g className="terrain-habitat-canopy" transform={`translate(${shift} 0)`}>
    <path d="M68 104Q78 26 151 20Q226 26 236 104" fill={b.glass} opacity=".024" stroke={b.glass} strokeWidth="1.3"/>
    <path d="M82 103Q91 38 151 33Q212 38 222 103" fill="none" stroke={b.glass} strokeWidth=".85" opacity=".28"/>
    <path d="M151 22V103M105 43Q128 67 130 103M198 44Q176 67 173 103" fill="none" stroke={b.glass} strokeWidth=".7" opacity=".2"/>
    <ellipse cx="151" cy="102" rx="84" ry="11" fill="none" stroke={b.glass} strokeWidth="1" opacity=".23"/>
    <path d="M80 78Q151 49 224 78" fill="none" stroke="#edf3df" strokeWidth=".55" opacity=".13"/>
    <circle cx="151" cy="31" r="2.4" fill={b.warm} opacity=".82" className="terrain-city-light"/>
  </g>;
}

export const IslandTerrain = memo(function IslandTerrain({ district }: { district: number }) {
  const b = biome(district);
  const uid = useId().replace(/:/g, "");
  const clipId = `terrain-clip-${uid}`;
  const topId = `terrain-top-${uid}`;
  const rockId = `terrain-rock-${uid}`;
  const glowId = `terrain-glow-${uid}`;
  const fogId = `terrain-fog-${uid}`;
  const lightFilterId = `terrain-light-${uid}`;
  const rim = islandOutlinePoints(district);
  const points = rim.map(p => `${p.x},${p.y}`).join(" ");
  const underPoints = rim.map((p, i) => `${p.x + (i < 18 ? -2 : 2)},${p.y + 36 + noise(district * 101 + i) * 15}`).join(" ");
  const deepPoints = rim.map((p, i) => `${p.x + (i < 18 ? -4 : 4)},${p.y + 54 + noise(district * 109 + i) * 18}`).join(" ");

  return <svg className={`island-terrain drawn-terrain terrain-${b.shape}`} viewBox="0 0 300 210" role="img" aria-label={`${b.name} living district. Landmark: ${b.landmark}.`}>
    <defs>
      <clipPath id={clipId}><polygon points={points}/></clipPath>
      <linearGradient id={topId} x1=".08" y1=".05" x2=".9" y2="1"><stop offset="0" stopColor={b.edge}/><stop offset=".18" stopColor={b.ground}/><stop offset=".72" stopColor={b.ground2}/><stop offset="1" stopColor={b.shadow}/></linearGradient>
      <linearGradient id={rockId} x1="0" y1="0" x2=".18" y2="1"><stop offset="0" stopColor={b.rock}/><stop offset=".52" stopColor={b.shadow}/><stop offset="1" stopColor="#07100e"/></linearGradient>
      <radialGradient id={glowId}><stop offset="0" stopColor={b.warm} stopOpacity=".28"/><stop offset=".42" stopColor={b.water} stopOpacity=".11"/><stop offset="1" stopColor={b.water} stopOpacity="0"/></radialGradient>
      <linearGradient id={fogId} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={b.glass} stopOpacity="0"/><stop offset=".5" stopColor={b.glass} stopOpacity=".11"/><stop offset="1" stopColor={b.glass} stopOpacity="0"/></linearGradient>
      <filter id={lightFilterId} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>

    <ellipse cx="151" cy="176" rx="121" ry="18" fill="#000" opacity=".4"/>
    <ellipse cx="151" cy="149" rx="145" ry="48" fill={`url(#${glowId})`} opacity=".88"/>
    <ellipse cx="151" cy="153" rx="126" ry="15" fill="none" stroke={b.water} strokeWidth="1" opacity=".16"/>
    <ellipse cx="151" cy="153" rx="105" ry="10" fill="none" stroke="#d7e8df" strokeWidth=".55" opacity=".09"/>

    <polygon points={deepPoints} fill="#081210" stroke="#0d1a17" strokeWidth="1" opacity=".94"/>
    <polygon points={underPoints} fill={`url(#${rockId})`} stroke={b.shadow} strokeWidth="1.2"/>
    {Array.from({ length: 16 }, (_, i) => {
      const x = 37 + i * 15 + (noise(district * 19 + i) - .5) * 7;
      const y = 126 + noise(district * 31 + i) * 20;
      const depth = 26 + noise(i + district * 5) * 28;
      return <path key={i} d={`M${x} ${y}l${(noise(i+3)-.5)*9} ${depth}`} stroke={i % 3 ? b.shadow : b.rock} strokeWidth="1.3" opacity=".56"/>;
    })}

    <polygon points={points} fill={`url(#${topId})`} stroke={b.edge} strokeWidth="2.2"/>
    <g clipPath={`url(#${clipId})`}>
      <ellipse cx="151" cy="83" rx="119" ry="43" fill="#dce3c7" opacity=".035"/>
      <path d="M13 107Q75 85 126 94T286 90" fill="none" stroke="#e4e9d0" strokeWidth="1" opacity=".12"/>
      <path d="M15 120Q86 96 150 106T286 99" fill="none" stroke={b.shadow} strokeWidth="1" opacity=".25"/>
      <Scenery district={district}/>
      <path d="M63 115Q102 95 137 104Q154 111 176 100Q208 88 240 109" fill="none" stroke="#d3d9bd" strokeWidth="4.4" opacity=".1"/>
      <path d="M67 115Q104 97 138 105Q155 112 176 101Q207 90 236 109" fill="none" stroke={b.edge} strokeWidth="1.15" opacity=".45"/>
      <Landmark district={district}/>
      <CityInfrastructure district={district}/>
      {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={28 + noise(district * 71 + i) * 244} cy={70 + noise(district * 83 + i) * 56} r={.55 + noise(i * 5 + district) * 1.15} fill={i % 4 === 0 ? b.warm : b.edge} opacity={.08 + noise(i + district) * .16}/>) }
    </g>

    <HabitatCanopy district={district}/>

    <g filter={`url(#${lightFilterId})`} className="terrain-inhabited-light">
      <circle cx="151" cy="90" r="2" fill={b.warm} opacity=".64"/>
      <circle cx="102" cy="112" r="1.25" fill={b.warm} opacity=".56"/>
      <circle cx="205" cy="105" r="1.1" fill={b.glass} opacity=".62"/>
      <circle cx="230" cy="116" r=".9" fill={b.warm} opacity=".42"/>
    </g>

    <path d="M52 118Q151 148 250 118" fill="none" stroke="#d8e0c8" strokeWidth=".65" opacity=".13"/>
    <path d="M74 131Q151 152 228 131" fill="none" stroke={b.warm} strokeWidth=".55" opacity=".13"/>
    <path d="M21 148H279" stroke={`url(#${fogId})`} strokeWidth="8" opacity=".5"/>
    <polygon points={points} fill="none" stroke="#eef2de" strokeWidth=".55" opacity=".13" transform="translate(10 6) scale(.935)"/>
  </svg>;
});
