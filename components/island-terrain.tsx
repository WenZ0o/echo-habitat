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
  shape: IslandShape;
};

export const BIOMES: IslandBiome[] = [
  { name: "Verdant Canopy", shortName: "Canopy", landmark: "The Elder Tree", mood: "Ancient green refuge", ground: "#526f47", ground2: "#304d3a", edge: "#aec887", rock: "#304139", shadow: "#172821", accent: "#d8d79b", water: "#5faaa0", shape: "canopy" },
  { name: "Amber Mesa", shortName: "Mesa", landmark: "The Sun Pillar", mood: "Warm wind over old stone", ground: "#a66e43", ground2: "#79503c", edge: "#e4bd80", rock: "#5d3c35", shadow: "#2d2927", accent: "#f0d295", water: "#6e9e91", shape: "mesa" },
  { name: "Moonlit Lagoon", shortName: "Lagoon", landmark: "The Moon Pool", mood: "Shallow water and silver light", ground: "#688a6b", ground2: "#456f68", edge: "#d3d6a5", rock: "#385455", shadow: "#173338", accent: "#bde6da", water: "#4a9da0", shape: "crescent" },
  { name: "Ancient Ruins", shortName: "Ruins", landmark: "The Broken Gate", mood: "Stone memory under new growth", ground: "#737b5d", ground2: "#4f604b", edge: "#c1c6a7", rock: "#424a43", shadow: "#202a27", accent: "#d3c89b", water: "#5c8f82", shape: "ruins" },
  { name: "Basalt Crown", shortName: "Basalt", landmark: "The Obsidian Spire", mood: "Dark cliffs above quiet water", ground: "#4f6555", ground2: "#354b48", edge: "#93ae91", rock: "#293538", shadow: "#141f22", accent: "#aac6b6", water: "#426d70", shape: "crown" },
  { name: "Rice Terraces", shortName: "Terraces", landmark: "The Water Shrine", mood: "Patient water across stepped fields", ground: "#78924f", ground2: "#526d48", edge: "#d2d78e", rock: "#465341", shadow: "#203027", accent: "#ece0aa", water: "#6ba6a0", shape: "terraces" },
  { name: "Crystal Crags", shortName: "Crystal", landmark: "The Crystal Heart", mood: "Cold mineral light", ground: "#657484", ground2: "#4d5d72", edge: "#c4d0dd", rock: "#35394b", shadow: "#202333", accent: "#c5e1ea", water: "#527f96", shape: "crystal" },
  { name: "Wind Gardens", shortName: "Wind", landmark: "The Wind Arch", mood: "Open grass beneath a high sky", ground: "#78906a", ground2: "#536e60", edge: "#d1d7aa", rock: "#49564e", shadow: "#24332d", accent: "#e5ddba", water: "#6b9f99", shape: "windswept" },
  { name: "Sunken Sanctuary", shortName: "Sanctuary", landmark: "The Drowned Temple", mood: "A ruin held between land and tide", ground: "#5e7869", ground2: "#3f625d", edge: "#b9c99f", rock: "#394b48", shadow: "#172c2d", accent: "#c9d7ad", water: "#438489", shape: "sanctuary" },
  { name: "Ashen Bloom", shortName: "Bloom", landmark: "The Ember Tree", mood: "New color on black earth", ground: "#665f4f", ground2: "#49473f", edge: "#b5ae87", rock: "#343536", shadow: "#1c2021", accent: "#e18f62", water: "#526f70", shape: "caldera" },
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
    Math.hypot(item.x - position.x, item.y - position.y) <
    Math.hypot(best.x - position.x, best.y - position.y) ? item : best);
  const target = buildingPosition(nearest.id, district);
  return { x: position.x + target.x - nearest.x, y: position.y + target.y - nearest.y };
}

function shapeRadius(shape: IslandShape, angle: number, district: number, index: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const jitter = .94 + noise(district * 41 + index * 3) * .1;
  if (shape === "crescent") return jitter * (c > .42 ? .72 : 1.03);
  if (shape === "mesa") return jitter * (.98 + Math.cos(angle * 4) * .035);
  if (shape === "crown") return jitter * (.93 + Math.sin(angle * 5 + .8) * .11);
  if (shape === "terraces") return jitter * (1 + Math.cos(angle * 2) * .08);
  if (shape === "crystal") return jitter * (.91 + Math.abs(Math.sin(angle * 3)) * .1);
  if (shape === "windswept") return jitter * (c < -.25 ? 1.1 : .94);
  if (shape === "sanctuary") return jitter * (s > .45 && c > -.2 ? .76 : 1.02);
  if (shape === "caldera") return jitter * (.96 + Math.sin(angle * 4 + .6) * .06);
  if (shape === "ruins") return jitter * (.96 + Math.cos(angle * 3) * .05);
  return jitter * (1 + Math.sin(angle * 3 + district) * .035);
}

export function islandOutlinePoints(district: number) {
  const b = biome(district);
  return Array.from({ length: 28 }, (_, i) => {
    const angle = i / 28 * Math.PI * 2;
    const radius = shapeRadius(b.shape, angle, district, i);
    const wide = b.shape === "windswept" ? 139 : b.shape === "terraces" ? 142 : 132;
    const high = b.shape === "crown" || b.shape === "crystal" ? 66 : 59;
    return {
      x: 150 + Math.cos(angle) * wide * radius,
      y: 76 + Math.sin(angle) * high * radius,
    };
  });
}

function Tree({ x, y, scale = 1, warm = false }: { x: number; y: number; scale?: number; warm?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M0 13C-1 5 1-4 2-13" stroke={warm ? "#584032" : "#4a4431"} strokeWidth="3.2" strokeLinecap="round"/>
    <ellipse cx="0" cy="-17" rx="9" ry="7" fill={warm ? "#80624a" : "#315640"}/>
    <ellipse cx="-7" cy="-13" rx="7" ry="6" fill={warm ? "#a07149" : "#426b4b"}/>
    <ellipse cx="7" cy="-13" rx="7" ry="6" fill={warm ? "#98634b" : "#547755"}/>
  </g>;
}

function Landmark({ district }: { district: number }) {
  const kind = (district - 1) % BIOMES.length;
  if (kind === 0) return <g className="terrain-landmark" transform="translate(151 61)"><path d="M-2 34C-7 12-4-8 2-33M0 5l-24-18M1-5l25-19" stroke="#65523b" strokeWidth="6" strokeLinecap="round"/><ellipse cy="-36" rx="30" ry="18" fill="#315c43"/><ellipse cx="-22" cy="-27" rx="21" ry="15" fill="#416e4d"/><ellipse cx="22" cy="-27" rx="22" ry="16" fill="#567d54"/><ellipse cy="-46" rx="18" ry="12" fill="#789665" opacity=".8"/></g>;
  if (kind === 1) return <g className="terrain-landmark" transform="translate(154 62)"><path d="M-13 31L-6-37 8-48 15 31Z" fill="#704637" stroke="#e2ad70" strokeWidth="2"/><path d="M-5-31L8-38M-8-9L11-16M-10 14L13 7" stroke="#d98f55" strokeWidth="2" opacity=".65"/></g>;
  if (kind === 2) return <g className="terrain-landmark"><ellipse cx="149" cy="73" rx="39" ry="22" fill="#438b91" stroke="#d7d9b0" strokeWidth="5"/><ellipse cx="149" cy="72" rx="25" ry="13" fill="#73c4bf" opacity=".7"/><path d="M119 77Q149 95 181 76" fill="none" stroke="#dcebd8" strokeWidth="1.5" opacity=".7"/></g>;
  if (kind === 3) return <g className="terrain-landmark" fill="none" stroke="#bfc4a9" strokeWidth="6"><path d="M122 91V53Q122 31 149 31Q176 31 176 53V91"/><path d="M132 91V57Q132 43 149 43Q166 43 166 57V91" strokeWidth="3"/><path d="M111 92H188" stroke="#626d5f" strokeWidth="5"/></g>;
  if (kind === 4) return <g className="terrain-landmark" transform="translate(151 70)"><path d="M-13 24L-6-30 3-54 12-20 18 24Z" fill="#26343a" stroke="#98b8ad" strokeWidth="2"/><path d="M3-48L1 10" stroke="#729991" strokeWidth="2" opacity=".7"/></g>;
  if (kind === 5) return <g className="terrain-landmark" transform="translate(150 73)"><path d="M-25 18H25L16-8H-17Z" fill="#6e7257" stroke="#dfd49d" strokeWidth="2"/><path d="M-13-7V-24M13-7V-24M-18-24H18" stroke="#d8c98e" strokeWidth="4"/><path d="M-29 20Q0 34 30 20" fill="none" stroke="#73b2aa" strokeWidth="5"/></g>;
  if (kind === 6) return <g className="terrain-landmark" transform="translate(151 72)"><path d="M-18 19L-8-35 1-52 8-22 18 20Z" fill="#7c9eb8" stroke="#d1e5ec" strokeWidth="2"/><path d="M-4 14L1-45M8-18L13 16" stroke="#c8f1ef" strokeWidth="2" opacity=".75"/></g>;
  if (kind === 7) return <g className="terrain-landmark" transform="translate(150 68)" fill="none" stroke="#ded7ad" strokeWidth="6" strokeLinecap="round"><path d="M-29 24Q-27-18 0-18Q27-18 29 24"/><path d="M-17 24Q-15-7 0-7Q15-7 17 24" strokeWidth="3"/></g>;
  if (kind === 8) return <g className="terrain-landmark" transform="translate(151 78)"><path d="M-31 13H31L22-15H-22Z" fill="#53635b" stroke="#aab99a" strokeWidth="2"/><path d="M-18-14V-35H18V-14M-5-35V-46H6V-35" fill="none" stroke="#c2c9a5" strokeWidth="4"/><path d="M-37 16Q0 30 38 15" fill="none" stroke="#5ca2a1" strokeWidth="7" opacity=".8"/></g>;
  return <g className="terrain-landmark" transform="translate(151 64)"><path d="M0 31C-5 10-2-10 1-27M0-8l-19-13M1-13l19-15" stroke="#493936" strokeWidth="5" strokeLinecap="round"/><ellipse cy="-32" rx="21" ry="13" fill="#7c4b3e"/><ellipse cx="-17" cy="-24" rx="15" ry="11" fill="#a15d42"/><ellipse cx="17" cy="-25" rx="15" ry="11" fill="#cc7047"/></g>;
}

function Scenery({ district }: { district: number }) {
  const kind = (district - 1) % BIOMES.length;
  if (kind === 0) return <g>{Array.from({ length: 13 }, (_, i) => <Tree key={i} x={43 + noise(district * 13 + i) * 210} y={54 + noise(district * 23 + i) * 65} scale={.55 + noise(i + district) * .38}/>)}</g>;
  if (kind === 1) return <g fill="none" stroke="#d59b68" strokeWidth="3" opacity=".6"><path d="M35 58Q86 44 116 51M43 73Q85 59 117 66M190 53Q231 45 262 61M194 70Q229 62 254 76"/><path d="M55 104Q148 79 241 105" stroke="#543c35" strokeWidth="5"/></g>;
  if (kind === 2) return <g><path d="M33 78Q78 46 111 54Q91 83 112 109Q72 115 37 98Z" fill="#4f9ba0" opacity=".72"/><path d="M191 45Q236 54 266 82Q240 106 199 100Q216 74 191 45Z" fill="#67afb0" opacity=".62"/>{[60,226].map((x,i)=><g key={x} transform={`translate(${x} ${88+i*5})`}><path d="M0 11V-9" stroke="#6d513c" strokeWidth="2"/><path d="M0-9l-9-5M0-9l10-4M0-7l-11 1M0-7l12 2" stroke="#75966a" strokeWidth="3"/></g>)}</g>;
  if (kind === 3) return <g fill="#929982" stroke="#5b665b" strokeWidth="1.5" opacity=".9"><path d="M48 86V49h31v37H67V62H58v24Z"/><path d="M214 93V43h12v50ZM234 91V58h11v33Z"/><path d="M70 112h37v8H70zM194 105h40v7h-40z"/></g>;
  if (kind === 4) return <g fill="#334143" stroke="#697d78" strokeWidth="1.2"><path d="M43 95l17-43 18 43zM77 111l17-34 16 34zM215 95l18-51 20 51zM191 111l12-35 17 35z"/></g>;
  if (kind === 5) return <g fill="none" strokeWidth="6"><path d="M29 63Q74 32 121 39" stroke="#dbd79a"/><path d="M34 75Q78 46 123 51" stroke="#5f8254"/><path d="M42 87Q82 61 124 64" stroke="#9cb96c"/><path d="M179 77Q228 57 270 67" stroke="#d9d69a"/><path d="M176 90Q226 72 264 81" stroke="#587851"/><path d="M175 103Q221 88 257 94" stroke="#9ab769"/></g>;
  if (kind === 6) return <g stroke="#c5e6ea" strokeWidth="1">{[{x:54,y:91,h:35},{x:87,y:109,h:24},{x:218,y:91,h:43},{x:244,y:111,h:27},{x:193,y:55,h:23}].map((p,i)=><path key={i} d={`M${p.x-8} ${p.y}l4 -${p.h} 9 -8 8 ${p.h}-9 11Z`} fill={i%2 ? "#718ba8" : "#839eb8"}/>)}</g>;
  if (kind === 7) return <g>{Array.from({ length: 12 }, (_, i) => { const x=38+noise(district*17+i)*225,y=76+noise(district*31+i)*45; return <g key={i} transform={`translate(${x} ${y})`}><path d="M0 8Q-4-1-1-12" stroke="#536c53" strokeWidth="1.4"/><path d="M-1-7q8-5 13-1q-7 5-13 4" fill="#9db47c" opacity=".75"/></g>; })}</g>;
  if (kind === 8) return <g><path d="M35 82Q75 57 111 64Q97 91 114 110Q67 118 37 99Z" fill="#43878a" opacity=".7"/><path d="M191 65Q231 55 263 79Q247 106 199 105Q212 83 191 65Z" fill="#397a80" opacity=".75"/><path d="M55 104h48M205 111h43" stroke="#839b7d" strokeWidth="4"/></g>;
  return <g><ellipse cx="150" cy="76" rx="55" ry="25" fill="#343c39" opacity=".7"/><ellipse cx="150" cy="76" rx="33" ry="13" fill="#1f2928" opacity=".7"/>{Array.from({ length: 13 }, (_, i) => <circle key={i} cx={36+noise(i*3+district)*229} cy={63+noise(i*7+district)*59} r={1.5+noise(i+9)*2.5} fill={i%3===0?"#d97650":"#a58a63"} opacity=".78"/>)}</g>;
}

export const IslandTerrain = memo(function IslandTerrain({ district }: { district: number }) {
  const b = biome(district);
  const terrainId = useId();
  const groundId = useId();
  const waterId = useId();
  const rim = islandOutlinePoints(district);
  const points = rim.map(p => `${p.x},${p.y}`).join(" ");
  const lower = rim.filter((_, i) => i > 0 && i < 14);

  return <svg className={`island-terrain drawn-terrain terrain-${b.shape}`} viewBox="0 0 300 200" role="img" aria-label={`${b.name} island. Landmark: ${b.landmark}.`}>
    <defs>
      <clipPath id={terrainId}><polygon points={points}/></clipPath>
      <linearGradient id={groundId} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={b.edge}/><stop offset=".22" stopColor={b.ground}/><stop offset="1" stopColor={b.ground2}/></linearGradient>
      <radialGradient id={waterId}><stop offset="0" stopColor={b.water} stopOpacity=".7"/><stop offset="1" stopColor={b.water} stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse className="terrain-shadow" cx="150" cy="166" rx="107" ry="17" fill="#000" opacity=".28"/>
    <ellipse className="terrain-water-glow" cx="150" cy="142" rx="136" ry="44" fill={`url(#${waterId})`} opacity=".28"/>
    {lower.map((p, i) => {
      const q = lower[Math.min(i + 1, lower.length - 1)];
      if (p === q) return null;
      const depth = 35 + noise(district * 19 + i) * 32;
      return <polygon key={i} points={`${p.x},${p.y} ${q.x},${q.y} ${q.x - 8},${q.y + depth} ${p.x + 7},${p.y + depth - 8}`} fill={i % 2 ? b.rock : b.shadow} stroke={b.shadow} strokeWidth="1"/>;
    })}
    <polygon points={points} fill={`url(#${groundId})`} stroke={b.edge} strokeWidth="2.3"/>
    <g clipPath={`url(#${terrainId})`}>
      <path d="M18 106Q76 77 126 88T282 79" fill="none" stroke={b.edge} strokeWidth="1.2" opacity=".22"/>
      <path d="M22 121Q87 91 148 104T279 96" fill="none" stroke={b.shadow} strokeWidth="1" opacity=".3"/>
      <Scenery district={district}/>
      <Landmark district={district}/>
      {Array.from({ length: 24 }, (_, i) => <circle key={i} cx={28 + noise(district * 71 + i) * 244} cy={45 + noise(district * 83 + i) * 84} r={.7 + noise(i * 5 + district) * 1.8} fill={i % 4 === 0 ? b.accent : b.edge} opacity={.16 + noise(i + district) * .22}/>) }
    </g>
    <polygon points={points} fill="none" stroke={b.accent} strokeWidth=".8" opacity=".22" transform="translate(12 7) scale(.92)"/>
  </svg>;
});
