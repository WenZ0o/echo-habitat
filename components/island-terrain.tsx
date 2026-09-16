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

/*
 * All districts deliberately share Origin's material language: deep moss,
 * charcoal stone, muted brass, pale glass and warm inhabited light.
 * Biomes vary topology and emphasis rather than becoming disconnected themes.
 */
export const BIOMES: IslandBiome[] = [
  { name: "Verdant Canopy", shortName: "Canopy", landmark: "The Elder Tree", mood: "An old grove protected beneath a light canopy", ground: "#52694c", ground2: "#32473d", edge: "#99ad7f", rock: "#2e3d38", shadow: "#182521", accent: "#c7cf91", water: "#5f9087", glass: "#a9c9bd", warm: "#d7bd79", shape: "canopy" },
  { name: "Amber Mesa", shortName: "Mesa", landmark: "The Sun Pillar", mood: "Weathered stone warmed by the same quiet habitat light", ground: "#657054", ground2: "#444c3f", edge: "#a9ad83", rock: "#403d35", shadow: "#211f1c", accent: "#cbbb86", water: "#657f78", glass: "#b9c9b8", warm: "#d4ad70", shape: "mesa" },
  { name: "Moonlit Lagoon", shortName: "Lagoon", landmark: "The Moon Pool", mood: "A sheltered basin where glass and water hold the light", ground: "#536c5d", ground2: "#354d47", edge: "#a8b99a", rock: "#2f4140", shadow: "#182827", accent: "#bdcba4", water: "#5f9992", glass: "#b6d2c8", warm: "#d0b77d", shape: "crescent" },
  { name: "Ancient Ruins", shortName: "Ruins", landmark: "The Broken Gate", mood: "Old masonry folded into a new living settlement", ground: "#5e6952", ground2: "#3e4a3f", edge: "#a7af8e", rock: "#3b403b", shadow: "#202723", accent: "#c1bf91", water: "#607f76", glass: "#afc4b6", warm: "#d1b477", shape: "ruins" },
  { name: "Basalt Crown", shortName: "Basalt", landmark: "The Obsidian Spire", mood: "Dark mineral shelves cut by thin lines of inhabited light", ground: "#4b5d50", ground2: "#30423e", edge: "#879c81", rock: "#293334", shadow: "#141d1d", accent: "#afbd93", water: "#4d7470", glass: "#9ebdb5", warm: "#caa86f", shape: "crown" },
  { name: "Rice Terraces", shortName: "Terraces", landmark: "The Water Shrine", mood: "Stepped gardens and water following the island's contours", ground: "#64764e", ground2: "#405444", edge: "#acba82", rock: "#37433b", shadow: "#1d2b25", accent: "#c9cc8f", water: "#6a9790", glass: "#b5cab8", warm: "#d1b875", shape: "terraces" },
  { name: "Crystal Crags", shortName: "Crags", landmark: "The Glass Heart", mood: "Pale mineral ribs reflecting the habitat's soft light", ground: "#56665d", ground2: "#394943", edge: "#a3b2a4", rock: "#30383a", shadow: "#191f21", accent: "#b9c6a5", water: "#5b807c", glass: "#bfd3cc", warm: "#cfb173", shape: "crystal" },
  { name: "Wind Gardens", shortName: "Wind", landmark: "The Wind Arch", mood: "Low gardens and flexible structures beneath a wide canopy", ground: "#607057", ground2: "#3e5045", edge: "#a8b68e", rock: "#36413c", shadow: "#1c2925", accent: "#c2c998", water: "#648982", glass: "#afc8bf", warm: "#d0b67b", shape: "windswept" },
  { name: "Sunken Sanctuary", shortName: "Sanctuary", landmark: "The Drowned Temple", mood: "Half-flooded stone chambers reclaimed as living rooms", ground: "#53695e", ground2: "#344c47", edge: "#9fb39a", rock: "#34413e", shadow: "#192725", accent: "#bec79a", water: "#538c88", glass: "#afd0c7", warm: "#ceb078", shape: "sanctuary" },
  { name: "Ashen Bloom", shortName: "Bloom", landmark: "The Ember Tree", mood: "Dark earth carrying new growth and warm glass light", ground: "#555d4d", ground2: "#3c443c", edge: "#9ca681", rock: "#323634", shadow: "#1b201e", accent: "#c0b889", water: "#5b7773", glass: "#a8c3b9", warm: "#cf9d6d", shape: "caldera" },
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
  const jitter = .965 + noise(district * 41 + index * 3) * .065;
  if (shape === "crescent") return jitter * (c > .45 ? .78 : 1.02);
  if (shape === "mesa") return jitter * (.985 + Math.cos(angle * 4) * .022);
  if (shape === "crown") return jitter * (.95 + Math.sin(angle * 5 + .8) * .065);
  if (shape === "terraces") return jitter * (1 + Math.cos(angle * 2) * .045);
  if (shape === "crystal") return jitter * (.95 + Math.abs(Math.sin(angle * 3)) * .055);
  if (shape === "windswept") return jitter * (c < -.3 ? 1.065 : .97);
  if (shape === "sanctuary") return jitter * (s > .5 && c > -.2 ? .83 : 1.01);
  if (shape === "caldera") return jitter * (.98 + Math.sin(angle * 4 + .6) * .035);
  if (shape === "ruins") return jitter * (.98 + Math.cos(angle * 3) * .028);
  return jitter * (1 + Math.sin(angle * 3 + district) * .02);
}

export function islandOutlinePoints(district: number) {
  const b = biome(district);
  return Array.from({ length: 32 }, (_, i) => {
    const angle = i / 32 * Math.PI * 2;
    const radius = shapeRadius(b.shape, angle, district, i);
    const wide = b.shape === "windswept" ? 137 : b.shape === "terraces" ? 139 : 132;
    const high = b.shape === "crown" || b.shape === "crystal" ? 49 : 46;
    return { x: 150 + Math.cos(angle) * wide * radius, y: 92 + Math.sin(angle) * high * radius };
  });
}

function Tree({ x, y, scale = 1, tint = "#47664f" }: { x: number; y: number; scale?: number; tint?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 12C-1 5 0-3 2-12" stroke="#554937" strokeWidth="2.7" strokeLinecap="round"/>
    <ellipse cx="0" cy="-15" rx="8.2" ry="6.3" fill={tint}/>
    <ellipse cx="-6" cy="-11" rx="6.5" ry="5.5" fill="#385b45"/>
    <ellipse cx="7" cy="-11" rx="6.2" ry="5.2" fill="#587259"/>
    <ellipse cx="1" cy="-19" rx="4.8" ry="3.5" fill="#78906d" opacity=".58"/>
  </g>;
}

function HabitatCanopy({ district, glass, warm }: { district: number; glass: string; warm: string }) {
  const shift = (noise(district * 91) - .5) * 12;
  return <g className="terrain-habitat-canopy" transform={`translate(${shift} 0)`}>
    <path d="M72 101Q83 30 151 25Q221 29 232 101" fill="none" stroke={glass} strokeWidth="1.25" opacity=".37"/>
    <path d="M91 99Q101 43 151 38Q201 43 213 99" fill="none" stroke={glass} strokeWidth=".8" opacity=".22"/>
    <path d="M151 27V99M109 43Q129 65 130 100M194 44Q174 65 172 100" fill="none" stroke={glass} strokeWidth=".75" opacity=".19"/>
    <ellipse cx="151" cy="99" rx="80" ry="10" fill="none" stroke={glass} strokeWidth="1" opacity=".23"/>
    <path d="M83 79Q151 51 221 79" fill="none" stroke="#edf3df" strokeWidth=".55" opacity=".12"/>
    <circle cx="151" cy="37" r="2.3" fill={warm} opacity=".75"/>
  </g>;
}

function Landmark({ district }: { district: number }) {
  const kind = (district - 1) % BIOMES.length;
  const b = biome(district);
  if (kind === 0) return <g className="terrain-landmark" transform="translate(151 71)"><path d="M0 25C-3 8-2-10 2-28M0-2l-20-14M1-9l19-16" stroke="#65523d" strokeWidth="5" strokeLinecap="round"/><ellipse cy="-31" rx="25" ry="14" fill="#355944"/><ellipse cx="-18" cy="-23" rx="17" ry="12" fill="#45694e"/><ellipse cx="19" cy="-24" rx="18" ry="12" fill="#577557"/><ellipse cy="-40" rx="14" ry="9" fill="#7b936a" opacity=".62"/></g>;
  if (kind === 1) return <g className="terrain-landmark" transform="translate(151 74)"><path d="M-11 22L-6-29 4-39 12 22Z" fill="#535047" stroke={b.edge} strokeWidth="1.8"/><path d="M-4-22L7-27M-7-3L9-9M-8 13L10 8" stroke={b.warm} strokeWidth="1.4" opacity=".65"/></g>;
  if (kind === 2) return <g className="terrain-landmark"><ellipse cx="151" cy="83" rx="34" ry="17" fill={b.water} stroke={b.edge} strokeWidth="3"/><ellipse cx="151" cy="82" rx="22" ry="10" fill="#91b9ad" opacity=".35"/><path d="M124 86Q151 97 179 85" fill="none" stroke="#dce8d5" strokeWidth="1" opacity=".45"/></g>;
  if (kind === 3) return <g className="terrain-landmark" fill="none" stroke="#a7ad90" strokeWidth="4.2"><path d="M127 94V63Q127 43 151 43Q175 43 175 63V94"/><path d="M137 94V65Q137 54 151 54Q165 54 165 65V94" strokeWidth="2.2"/><path d="M116 95H187" stroke="#59635a" strokeWidth="4"/></g>;
  if (kind === 4) return <g className="terrain-landmark" transform="translate(151 76)"><path d="M-10 19L-5-25 2-39 9-15 14 19Z" fill="#293535" stroke="#839c92" strokeWidth="1.6"/><path d="M2-34V8" stroke={b.warm} strokeWidth="1.2" opacity=".55"/></g>;
  if (kind === 5) return <g className="terrain-landmark" transform="translate(151 80)"><path d="M-22 15H22L14-7H-15Z" fill="#5c6553" stroke="#b5b88a" strokeWidth="1.7"/><path d="M-11-6V-20M11-6V-20M-15-20H15" stroke="#c5bd8b" strokeWidth="3"/><path d="M-27 17Q0 27 28 17" fill="none" stroke={b.water} strokeWidth="4"/></g>;
  if (kind === 6) return <g className="terrain-landmark" transform="translate(151 78)"><path d="M-15 17L-7-28 0-40 7-18 15 18Z" fill="#71847d" stroke="#b8cbc2" strokeWidth="1.7"/><path d="M-3 12L0-35M6-15L11 14" stroke="#d5e4dd" strokeWidth="1.2" opacity=".5"/></g>;
  if (kind === 7) return <g className="terrain-landmark" transform="translate(151 76)" fill="none" stroke="#bdb992" strokeWidth="4.5" strokeLinecap="round"><path d="M-25 20Q-23-15 0-15Q23-15 25 20"/><path d="M-14 20Q-12-5 0-5Q12-5 14 20" strokeWidth="2.2"/></g>;
  if (kind === 8) return <g className="terrain-landmark" transform="translate(151 84)"><path d="M-28 10H28L19-13H-19Z" fill="#4f5d56" stroke="#98a78d" strokeWidth="1.7"/><path d="M-16-12V-29H16V-12M-4-29V-38H5V-29" fill="none" stroke="#afb594" strokeWidth="3"/><path d="M-33 13Q0 23 34 12" fill="none" stroke={b.water} strokeWidth="5" opacity=".7"/></g>;
  return <g className="terrain-landmark" transform="translate(151 73)"><path d="M0 22C-4 7-2-9 1-23M0-7l-16-10M1-11l16-12" stroke="#52433b" strokeWidth="4.2" strokeLinecap="round"/><ellipse cy="-27" rx="18" ry="11" fill="#665445"/><ellipse cx="-14" cy="-21" rx="12" ry="9" fill="#7c654d"/><ellipse cx="14" cy="-21" rx="12" ry="9" fill="#936c4e"/><circle cx="0" cy="-31" r="3" fill={b.warm} opacity=".65"/></g>;
}

function Scenery({ district }: { district: number }) {
  const family = (district - 1) % BIOMES.length;
  const b = biome(district);
  if (family === 0) return <g>{Array.from({ length: 15 }, (_, i) => <Tree key={i} x={41 + noise(district * 13 + i) * 217} y={72 + noise(district * 23 + i) * 47} scale={.48 + noise(i + district) * .3}/>)}</g>;
  if (family === 1) return <g><path d="M39 78Q83 65 118 70M45 90Q82 79 117 82M188 72Q225 64 260 78M194 85Q228 78 254 88" fill="none" stroke="#8e8064" strokeWidth="2.1" opacity=".48"/><path d="M62 105Q151 83 238 105" fill="none" stroke="#45443c" strokeWidth="4" opacity=".65"/></g>;
  if (family === 2) return <g><path d="M32 97Q67 74 108 81Q96 102 111 116Q68 122 36 109Z" fill={b.water} opacity=".62"/><path d="M192 80Q230 72 267 94Q247 117 205 115Q214 95 192 80Z" fill={b.water} opacity=".5"/>{[48,76,226,248].map((x,i)=><Tree key={i} x={x} y={101+i%2*8} scale={.52}/>)}</g>;
  if (family === 3) return <g stroke="#808877" fill="none" opacity=".62"><path d="M45 105V78H72V94M217 105V72H246V92M78 102H106V84H122" strokeWidth="3"/><path d="M39 111H125M196 111H260" strokeWidth="2"/></g>;
  if (family === 4) return <g fill="#34413f" stroke="#677a72" strokeWidth="1"><path d="M43 107l14-33 16 33zM75 116l15-27 15 27zM218 105l16-39 18 39zM192 115l11-27 14 27z"/></g>;
  if (family === 5) return <g fill="none" strokeWidth="4.2" opacity=".7"><path d="M29 79Q72 56 116 61" stroke="#b5b88d"/><path d="M34 90Q76 68 118 72" stroke="#5f7857"/><path d="M39 101Q78 80 119 83" stroke="#8fa36f"/><path d="M183 86Q226 69 268 77" stroke="#b4b88e"/><path d="M181 98Q224 82 262 89" stroke="#5a7354"/><path d="M180 109Q221 96 257 100" stroke="#8da06d"/></g>;
  if (family === 6) return <g stroke="#aebfb8" strokeWidth="1">{[{x:54,y:103,h:27},{x:87,y:116,h:18},{x:218,y:102,h:31},{x:244,y:116,h:20},{x:196,y:78,h:18}].map((p,i)=><path key={i} d={`M${p.x-7} ${p.y}l4 -${p.h} 8 -6 7 ${p.h}-8 9Z`} fill={i%2 ? "#5f706c" : "#71827d"}/>)}</g>;
  if (family === 7) return <g>{Array.from({ length: 13 }, (_, i) => { const x=39+noise(district*17+i)*222,y=92+noise(district*31+i)*30; return <g key={i} transform={`translate(${x} ${y})`}><path d="M0 7Q-3-1-1-10" stroke="#50634f" strokeWidth="1.2"/><path d="M-1-6q7-4 11-1q-6 4-11 3" fill="#879b73" opacity=".65"/></g>; })}</g>;
  if (family === 8) return <g><path d="M35 95Q72 75 108 81Q96 102 112 116Q70 121 39 111Z" fill={b.water} opacity=".55"/><path d="M194 82Q229 75 262 94Q247 114 205 113Q214 96 194 82Z" fill={b.water} opacity=".58"/><path d="M56 113h45M207 117h39" stroke="#7c8f78" strokeWidth="3"/></g>;
  return <g><ellipse cx="151" cy="94" rx="52" ry="19" fill="#303835" opacity=".55"/><ellipse cx="151" cy="94" rx="31" ry="10" fill="#202824" opacity=".62"/>{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={42+noise(i*3+district)*218} cy={86+noise(i*7+district)*34} r={1+noise(i+9)*1.8} fill={i%3===0?b.warm:b.edge} opacity=".45"/>)}</g>;
}

function PathNetwork({ district, edge }: { district: number; edge: string }) {
  const offset = (noise(district * 77) - .5) * 12;
  return <g fill="none" strokeLinecap="round">
    <path d={`M72 113Q103 ${98 + offset} 128 104Q155 111 183 99Q207 91 230 108`} stroke="#d0d5b2" strokeWidth="4.4" opacity=".13"/>
    <path d={`M78 113Q105 ${99 + offset} 129 105Q155 112 183 100Q207 92 225 108`} stroke={edge} strokeWidth="1.15" opacity=".46"/>
    <path d="M151 101Q149 118 151 129" stroke={edge} strokeWidth="1" opacity=".34"/>
  </g>;
}

export const IslandTerrain = memo(function IslandTerrain({ district }: { district: number }) {
  const b = biome(district);
  const clipId = useId();
  const topId = useId();
  const rockId = useId();
  const glowId = useId();
  const rim = islandOutlinePoints(district);
  const points = rim.map(p => `${p.x},${p.y}`).join(" ");
  const underPoints = rim.map((p, i) => `${p.x + (i < 16 ? -2 : 2)},${p.y + 33 + noise(district * 101 + i) * 14}`).join(" ");

  return <svg className={`island-terrain drawn-terrain terrain-${b.shape}`} viewBox="0 0 300 200" role="img" aria-label={`${b.name} island. Landmark: ${b.landmark}.`}>
    <defs>
      <clipPath id={clipId}><polygon points={points}/></clipPath>
      <linearGradient id={topId} x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stopColor={b.edge}/><stop offset=".24" stopColor={b.ground}/><stop offset="1" stopColor={b.ground2}/></linearGradient>
      <linearGradient id={rockId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={b.rock}/><stop offset="1" stopColor={b.shadow}/></linearGradient>
      <radialGradient id={glowId}><stop offset="0" stopColor={b.warm} stopOpacity=".23"/><stop offset=".62" stopColor={b.water} stopOpacity=".08"/><stop offset="1" stopColor={b.water} stopOpacity="0"/></radialGradient>
    </defs>

    <ellipse className="terrain-shadow" cx="151" cy="166" rx="108" ry="15" fill="#000" opacity=".32"/>
    <ellipse className="terrain-water-glow" cx="151" cy="142" rx="137" ry="43" fill={`url(#${glowId})`} opacity=".72"/>

    <polygon points={underPoints} fill={`url(#${rockId})`} stroke={b.shadow} strokeWidth="1.2"/>
    {Array.from({ length: 13 }, (_, i) => {
      const x = 45 + i * 17 + (noise(district * 19 + i) - .5) * 6;
      const y = 125 + noise(district * 31 + i) * 19;
      return <path key={i} d={`M${x} ${y}l${(noise(i+3)-.5)*8} ${22+noise(i+8)*18}`} stroke={i % 2 ? b.shadow : b.rock} strokeWidth="1.2" opacity=".52"/>;
    })}

    <polygon points={points} fill={`url(#${topId})`} stroke={b.edge} strokeWidth="2.2"/>
    <g clipPath={`url(#${clipId})`}>
      <ellipse cx="151" cy="84" rx="118" ry="42" fill="#d8dfc0" opacity=".035"/>
      <path d="M20 111Q78 89 127 96T281 91" fill="none" stroke="#e3e7cd" strokeWidth="1" opacity=".11"/>
      <path d="M20 121Q87 99 149 108T279 102" fill="none" stroke={b.shadow} strokeWidth="1" opacity=".24"/>
      <Scenery district={district}/>
      <PathNetwork district={district} edge={b.edge}/>
      <Landmark district={district}/>
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={33 + noise(district * 71 + i) * 234} cy={70 + noise(district * 83 + i) * 55} r={.6 + noise(i * 5 + district) * 1.3} fill={i % 5 === 0 ? b.warm : b.edge} opacity={.1 + noise(i + district) * .16}/>) }
    </g>

    <HabitatCanopy district={district} glass={b.glass} warm={b.warm}/>

    <path d="M55 116Q151 145 247 116" fill="none" stroke="#d8e0c8" strokeWidth=".65" opacity=".12"/>
    <path d="M77 129Q151 149 225 129" fill="none" stroke={b.warm} strokeWidth=".55" opacity=".12"/>
    <polygon points={points} fill="none" stroke="#eef2de" strokeWidth=".55" opacity=".13" transform="translate(10 6) scale(.935)"/>
  </svg>;
});
