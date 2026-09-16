import type { CSSProperties } from "react";
import type { BlueprintId } from "@/lib/habitat/types";

const ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];

type Aux = { sprite: number; x: number; y: number; scale: number; rotate?: number; unlock?: number };
type CityPlan = {
  label: string;
  family: string;
  mark: string;
  sprites: number[];
  scales: number[];
  rotations: number[];
  aux: Aux[];
};

/*
 * Every district stays inside the same high-resolution art family as Origin.
 * Variety comes from authored settlement composition rather than a second
 * vector art system: different districts favour different real structure
 * sprites, scales, rotations and supporting clusters.
 */
const CITY_PLANS: CityPlan[] = [
  {
    label: "Grove city", family: "grove", mark: "✦",
    sprites: [0, 0, 2, 3, 0, 5],
    scales: [1.12, .82, .92, .94, .82, 1.02], rotations: [-3, 4, 0, -2, 3, 0],
    aux: [
      { sprite: 0, x: 36, y: 58, scale: .48, rotate: -4, unlock: 1 },
      { sprite: 0, x: 62, y: 47, scale: .36, rotate: 5, unlock: 2 },
      { sprite: 3, x: 67, y: 60, scale: .31, rotate: -3, unlock: 4 },
      { sprite: 0, x: 53, y: 40, scale: .28, rotate: 6, unlock: 5 },
    ],
  },
  {
    label: "Sunworks", family: "sunworks", mark: "☼",
    sprites: [4, 1, 2, 1, 4, 5],
    scales: [.84, 1.2, .9, .82, 1.1, 1.02], rotations: [3, -5, 0, 4, -3, 0],
    aux: [
      { sprite: 1, x: 39, y: 48, scale: .48, rotate: -8, unlock: 1 },
      { sprite: 1, x: 61, y: 58, scale: .4, rotate: 7, unlock: 2 },
      { sprite: 4, x: 69, y: 43, scale: .34, rotate: -3, unlock: 3 },
      { sprite: 1, x: 52, y: 40, scale: .29, rotate: 10, unlock: 5 },
    ],
  },
  {
    label: "Water quarter", family: "water", mark: "◌",
    sprites: [0, 3, 2, 3, 3, 5],
    scales: [.84, 1.03, .9, 1.18, .88, 1.08], rotations: [-4, 3, 0, -1, 2, 1],
    aux: [
      { sprite: 3, x: 39, y: 61, scale: .48, rotate: 3, unlock: 1 },
      { sprite: 3, x: 64, y: 50, scale: .39, rotate: -4, unlock: 2 },
      { sprite: 5, x: 57, y: 63, scale: .31, rotate: 7, unlock: 4 },
      { sprite: 0, x: 46, y: 42, scale: .26, rotate: -5, unlock: 5 },
    ],
  },
  {
    label: "Archive city", family: "archive", mark: "⌂",
    sprites: [0, 2, 2, 3, 4, 5],
    scales: [.82, .9, 1.18, .82, .9, 1.04], rotations: [4, -2, 0, 3, -4, 0],
    aux: [
      { sprite: 2, x: 42, y: 48, scale: .48, rotate: -2, unlock: 1 },
      { sprite: 0, x: 64, y: 56, scale: .34, rotate: 5, unlock: 2 },
      { sprite: 4, x: 54, y: 64, scale: .32, rotate: -5, unlock: 4 },
      { sprite: 5, x: 69, y: 45, scale: .26, rotate: 8, unlock: 6 },
    ],
  },
  {
    label: "Basalt works", family: "basalt", mark: "▲",
    sprites: [4, 1, 2, 4, 4, 5],
    scales: [.92, .84, .96, .88, 1.2, 1.06], rotations: [-4, 3, 0, -3, 4, 0],
    aux: [
      { sprite: 4, x: 37, y: 57, scale: .5, rotate: -5, unlock: 1 },
      { sprite: 4, x: 64, y: 45, scale: .4, rotate: 5, unlock: 2 },
      { sprite: 1, x: 55, y: 65, scale: .32, rotate: -7, unlock: 4 },
      { sprite: 4, x: 69, y: 58, scale: .28, rotate: 3, unlock: 5 },
    ],
  },
  {
    label: "Terrace commune", family: "terrace", mark: "≈",
    sprites: [0, 1, 0, 3, 0, 5],
    scales: [1.16, .8, .88, 1.04, .9, 1.0], rotations: [-4, 4, 2, -2, 3, 0],
    aux: [
      { sprite: 0, x: 40, y: 50, scale: .47, rotate: -5, unlock: 1 },
      { sprite: 3, x: 61, y: 58, scale: .37, rotate: 3, unlock: 2 },
      { sprite: 0, x: 69, y: 45, scale: .31, rotate: 6, unlock: 3 },
      { sprite: 0, x: 51, y: 65, scale: .27, rotate: -7, unlock: 5 },
    ],
  },
  {
    label: "Glass ridge", family: "glass", mark: "◇",
    sprites: [1, 1, 2, 3, 2, 5],
    scales: [.82, 1.02, 1.2, .82, .94, 1.04], rotations: [4, -5, 0, 3, -3, 0],
    aux: [
      { sprite: 1, x: 39, y: 55, scale: .45, rotate: -8, unlock: 1 },
      { sprite: 2, x: 65, y: 51, scale: .4, rotate: 2, unlock: 2 },
      { sprite: 3, x: 54, y: 63, scale: .3, rotate: -3, unlock: 4 },
      { sprite: 1, x: 56, y: 40, scale: .27, rotate: 9, unlock: 5 },
    ],
  },
  {
    label: "Wind gardens", family: "wind", mark: "⌁",
    sprites: [0, 1, 2, 3, 1, 5],
    scales: [1.0, 1.12, .86, .82, .9, 1.08], rotations: [-5, 6, -1, 3, 5, 0],
    aux: [
      { sprite: 1, x: 37, y: 49, scale: .47, rotate: -10, unlock: 1 },
      { sprite: 0, x: 64, y: 58, scale: .37, rotate: 5, unlock: 2 },
      { sprite: 1, x: 58, y: 40, scale: .31, rotate: 10, unlock: 3 },
      { sprite: 1, x: 70, y: 51, scale: .27, rotate: -8, unlock: 5 },
    ],
  },
  {
    label: "Flooded sanctuary", family: "sanctuary", mark: "⌖",
    sprites: [3, 0, 2, 3, 4, 5],
    scales: [.92, .82, 1.02, 1.2, .82, 1.1], rotations: [3, -4, 0, 1, -3, 0],
    aux: [
      { sprite: 3, x: 41, y: 59, scale: .48, rotate: 3, unlock: 1 },
      { sprite: 5, x: 63, y: 49, scale: .36, rotate: -6, unlock: 2 },
      { sprite: 0, x: 55, y: 42, scale: .3, rotate: 5, unlock: 4 },
      { sprite: 3, x: 69, y: 61, scale: .28, rotate: -4, unlock: 5 },
    ],
  },
  {
    label: "Ember enclave", family: "ember", mark: "✧",
    sprites: [4, 1, 2, 4, 4, 5],
    scales: [.86, 1.04, 1.0, .82, 1.18, 1.04], rotations: [-3, 3, 0, 4, -4, 0],
    aux: [
      { sprite: 4, x: 38, y: 55, scale: .5, rotate: -4, unlock: 1 },
      { sprite: 1, x: 64, y: 48, scale: .38, rotate: 6, unlock: 2 },
      { sprite: 4, x: 56, y: 64, scale: .33, rotate: -5, unlock: 3 },
      { sprite: 3, x: 69, y: 57, scale: .27, rotate: 4, unlock: 5 },
    ],
  },
];

export function districtCityPlan(district: number) {
  return CITY_PLANS[(Math.max(1, district) - 1) % CITY_PLANS.length];
}

export function districtSpriteIndex(id: BlueprintId, district: number) {
  const index = ORDER.indexOf(id);
  return districtCityPlan(district).sprites[index] ?? index;
}

function spriteVars(sprite: number) {
  return {
    "--sprite-x": `${sprite % 3 * 50}%`,
    "--sprite-y": `${Math.floor(sprite / 3) * 100}%`,
  } as CSSProperties;
}

export function DistrictRasterStructure({ id, district, progress = 100, className = "" }: {
  id: BlueprintId;
  district: number;
  progress?: number;
  className?: string;
}) {
  const plan = districtCityPlan(district);
  const index = ORDER.indexOf(id);
  const sprite = districtSpriteIndex(id, district);
  return <span className={`raster-structure-shell district-kit-${plan.family} ${className}`} style={{
    "--raster-scale": String(plan.scales[index] ?? 1),
    "--raster-rotate": `${plan.rotations[index] ?? 0}deg`,
    "--raster-progress": `${Math.max(0, Math.min(100, progress))}%`,
  } as CSSProperties}>
    <span className="structure-sprite raster-structure-sprite" style={spriteVars(sprite)}/>
  </span>;
}

export function DistrictRasterIsland({ district, completed = 0, power = 100, compact = false }: {
  district: number;
  completed?: number;
  power?: number;
  compact?: boolean;
}) {
  const plan = districtCityPlan(district);
  return <span className={`district-raster-stack district-kit-${plan.family}${compact ? " is-compact" : ""}`} data-city-plan={plan.label}>
    <img className="district-raster-art island-terrain" src="/world-island.png" width={1536} height={1024} alt="" draggable={false}/>
    <span className="district-raster-lighting" aria-hidden="true"/>
    <span className="district-raster-aux" aria-hidden="true">
      {plan.aux.filter(item => completed >= (item.unlock ?? 1)).map((item, index) => <span key={index} className="district-aux-structure" style={{
        left: `${item.x}%`, top: `${item.y}%`, "--aux-scale": String(item.scale), "--aux-rotate": `${item.rotate ?? 0}deg`, opacity: power < 35 ? .42 : .86,
      } as CSSProperties}><span className="structure-sprite raster-structure-sprite" style={spriteVars(item.sprite)}/></span>)}
    </span>
  </span>;
}
