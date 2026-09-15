import { memo, useId } from "react";
import { BLUEPRINTS } from "@/lib/habitat/construction";
import type { BlueprintId, Position } from "@/lib/habitat/types";

export const BUILDING_ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];
export const BIOMES = [
  { name: "Woodland", ground: "#587147", edge: "#aac180", rock: "#354634" },
  { name: "Redstone mesa", ground: "#a97a48", edge: "#e3bb78", rock: "#634338" },
  { name: "Blue lagoon", ground: "#779976", edge: "#d2d7a4", rock: "#3a5558" },
  { name: "Crystal crags", ground: "#687787", edge: "#bdc9db", rock: "#36374c" },
  { name: "Rice terraces", ground: "#79934c", edge: "#ced78a", rock: "#43513b" },
  { name: "Ancient ruins", ground: "#7c8063", edge: "#b5bba0", rock: "#444943" },
];
export function biome(district: number) { return BIOMES[(district - 1) % BIOMES.length]; }
export function noise(seed: number) { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
export function buildingPosition(id: BlueprintId, district: number) {
  const index = BUILDING_ORDER.indexOf(id);
  return BLUEPRINTS.find(item => item.id === BUILDING_ORDER[index === 5 ? 5 : (index + district - 1) % 5])!;
}
export function residentPosition(position: Position, district: number) {
  if (!district) return position;
  const nearest = BLUEPRINTS.reduce((best, item) =>
    Math.hypot(item.x - position.x, item.y - position.y) <
    Math.hypot(best.x - position.x, best.y - position.y) ? item : best);
  const target = buildingPosition(nearest.id, district);
  return { x: position.x + target.x - nearest.x, y: position.y + target.y - nearest.y };
}
// District number alone determines scenery: ticking and reloading never reshuffle it.
export const IslandTerrain = memo(function IslandTerrain({ district }: { district: number }) {
  const b = biome(district), kind = (district - 1) % 6;
  const terrainId = useId();
  const rim = Array.from({ length: 20 }, (_, i) => {
    const a = i / 20 * Math.PI * 2;
    const radius = .89 + noise(district * 31 + i) * .11;
    const cx = Math.cos(a), sy = Math.sin(a);
    const shapeX = kind === 1 ? Math.sign(cx) * Math.pow(Math.abs(cx), .62) : cx;
    const shapeY = kind === 1 ? Math.sign(sy) * Math.pow(Math.abs(sy), .72) : sy;
    const notch = kind === 2 && cx > .7 ? .77 : 1;
    const ridge = kind === 3 ? 1 + Math.sin(a * 3) * .12 : 1;
    return { x: 150 + shapeX * (kind === 4 ? 140 : 130) * radius * notch * ridge, y: 73 + shapeY * (kind === 4 ? 52 : 63) * radius };
  });
  const points = rim.map(p => p.x + "," + p.y).join(" ");
  return <svg className="island-terrain drawn-terrain" viewBox="0 0 300 200" role="img" aria-label={b.name + " island with its own cliffs and landscape"}>
    <defs><clipPath id={terrainId}><polygon points={points}/></clipPath></defs>
    <ellipse cx="150" cy="172" rx="103" ry="15" fill="#000" opacity=".18"/>
    {rim.slice(0, 10).map((p, i) => {
      const q = rim[(i + 1) % rim.length], depth = 36 + noise(district + i * 7) * 34;
      return <polygon key={i} points={p.x+","+p.y+" "+q.x+","+q.y+" "+(q.x*.75+38)+","+(q.y+depth)+" "+(p.x*.75+38)+","+(p.y+depth-9)} fill={i % 2 ? b.rock : "#293735"} stroke="#172824" strokeWidth=".6"/>;
    })}
    <polygon points={points} fill={b.ground} stroke={b.edge} strokeWidth="2"/>
    <image href="/world-island.png" width="300" height="200" clipPath={"url(#"+terrainId+")"} opacity=".7" preserveAspectRatio="xMidYMid meet"/>
    <polygon points={points} fill="none" stroke={b.edge} strokeWidth="1" transform="translate(15 8) scale(.9)" opacity=".4"/>
    {kind === 0 && <g>
      <path d="M56 102 Q91 75 102 32" stroke="#b7a875" strokeWidth="7" fill="none" opacity=".5"/>
      {Array.from({length: 15}, (_, i) => { const x=40+noise(district*9+i)*215,y=25+noise(district*3+i+20)*70; return <g key={i} transform={"translate("+x+" "+y+")"}><path d="M0 1v13" stroke="#574631" strokeWidth="3"/><ellipse cy="-5" rx={7+noise(i+district)*6} ry="10" fill={i%2?"#254d3e":"#39684a"}/><ellipse cx="-3" cy="-8" rx="5" ry="6" fill="#83a36c" opacity=".65"/></g>; })}
    </g>}
    {kind === 1 && <g fill="#b77c54" stroke="#edbd81" strokeWidth="1.5"><path d="M35 79l10-40 29-8 11 20-12 39z"/><path d="M197 49l13-28 34 8 15 38-29 7z"/><path d="M54 50l20-6M43 66l36-7M211 36l31 7" fill="none"/><path d="M95 114Q156 76 228 101" stroke="#674933" strokeWidth="6" fill="none"/></g>}
    {kind === 2 && <g><path d="M100 73Q79 30 132 26Q193 20 192 62Q177 96 138 91Z" fill="#326f73" stroke="#d0cc95" strokeWidth="5"/><path d="M111 63Q114 36 153 38Q180 42 169 67" fill="none" stroke="#78c2ba" strokeWidth="3"/><path d="M144 91Q154 108 146 128L148 177" fill="none" stroke="#74bcba" strokeWidth="10" opacity=".85"/><path d="M148 130l2 39" stroke="#d0efdf" strokeWidth="2"/></g>}
    {kind === 3 && <g stroke="#b8d8e5" strokeWidth="1">
      {[{x:60,y:69,h:38},{x:228,y:77,h:52},{x:175,y:30,h:24},{x:83,y:114,h:29}].map((p,i)=><g key={i}><path d={"M"+(p.x-10)+" "+p.y+"l4 -"+p.h+" 12 -8 9 "+p.h+"-10 12z"} fill={i%2?"#738faf":"#859bba"}/><path d={"M"+(p.x+6)+" "+(p.y-p.h-8)+"l-1 "+(p.h+12)} fill="none"/></g>)}
    </g>}
    {kind === 4 && <g fill="none" strokeWidth="7">
      <path d="M32 73Q58 33 126 31" stroke="#d2cf8b"/><path d="M39 82Q67 44 122 44" stroke="#476744"/><path d="M48 90Q80 56 122 57" stroke="#a6bb6d"/><path d="M180 94Q244 76 263 55" stroke="#d2cf8b"/><path d="M173 107Q251 91 268 69" stroke="#476744"/><path d="M168 119Q239 111 260 92" stroke="#a6bb6d"/>
    </g>}
    {kind === 5 && <g fill="#a3aa91" stroke="#5a6458" strokeWidth="2"><path d="M47 82V38h38v44H74V52H58v30z"/><path d="M213 82V30h13v52zM233 86V45h12v41z"/><ellipse cx="146" cy="92" rx="31" ry="12" fill="none" stroke="#b2b8a0" strokeWidth="7"/><path d="M127 91l31 3M148 82l-5 18" fill="none"/></g>}
    {Array.from({length: 16}, (_, i) => <ellipse key={i} cx={35+noise(district*7+i)*228} cy={98+noise(district*17+i)*25} rx={1+noise(i)*3} ry="1.2" fill={b.edge} opacity=".5"/>)}
  </svg>;
});
