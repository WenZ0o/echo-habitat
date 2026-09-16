import type { CSSProperties } from "react";
import type { BlueprintId } from "@/lib/habitat/types";

const ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];

type Aux = { sprite: number; x: number; y: number; scale: number; rotate?: number };
type CityPlan = {
  label: string;
  sprites: number[];
  scales: number[];
  rotations: number[];
  aux: Aux[];
};

/*
 * These plans intentionally reuse the existing high-resolution structure sheet.
 * What changes from district to district is the visual vocabulary: some cities
 * repeat water architecture, others grow observatories, workshops or garden
 * modules. This keeps every city inside Origin's art style instead of drawing a
 * second, incompatible vector art system.
 */
const CITY_PLANS: CityPlan[] = [
  { label: "Grove city", sprites: [0,0,2,3,0,5], scales:[1.06,.9,1.02,.96,.86,1.06], rotations:[-2,3,0,-2,4,0], aux:[{sprite:0,x:35,y:58,scale:.42},{sprite:3,x:66,y:59,scale:.34},{sprite:0,x:57,y:44,scale:.28}] },
  { label: "Sunworks", sprites: [4,1,2,3,4,5], scales:[.9,1.1,1.08,.86,1.06,1.02], rotations:[2,-3,1,3,-2,0], aux:[{sprite:1,x:40,y:48,scale:.4},{sprite:4,x:62,y:58,scale:.36},{sprite:2,x:70,y:43,scale:.3}] },
  { label: "Water quarter", sprites: [3,3,2,3,4,5], scales:[.92,1,.98,1.1,.84,1.04], rotations:[-3,2,0,1,-2,0], aux:[{sprite:3,x:39,y:61,scale:.42},{sprite:3,x:63,y:49,scale:.34},{sprite:0,x:55,y:39,scale:.27}] },
  { label: "Archive city", sprites: [0,2,2,3,4,5], scales:[.9,.95,1.12,.86,.94,1], rotations:[2,-2,0,3,-3,0], aux:[{sprite:2,x:42,y:47,scale:.43},{sprite:2,x:64,y:54,scale:.34},{sprite:4,x:54,y:63,scale:.28}] },
  { label: "Basalt works", sprites: [4,1,2,4,4,5], scales:[.84,.96,1.12,.92,1.12,1.04], rotations:[-2,2,0,-2,3,0], aux:[{sprite:4,x:37,y:57,scale:.44},{sprite:4,x:63,y:45,scale:.34},{sprite:1,x:55,y:65,scale:.27}] },
  { label: "Terrace commune", sprites: [0,1,2,3,0,5], scales:[1.08,.86,.92,1.02,.92,1], rotations:[-3,3,1,-1,2,0], aux:[{sprite:0,x:40,y:50,scale:.39},{sprite:3,x:61,y:57,scale:.33},{sprite:0,x:69,y:45,scale:.26}] },
  { label: "Glass ridge", sprites: [2,1,2,3,2,5], scales:[.86,.9,1.15,.82,.98,1.02], rotations:[2,-2,0,3,-3,0], aux:[{sprite:2,x:39,y:55,scale:.42},{sprite:2,x:65,y:51,scale:.35},{sprite:1,x:55,y:40,scale:.27}] },
  { label: "Wind gardens", sprites: [0,1,2,3,0,5], scales:[.98,1.04,.9,.84,.86,1.06], rotations:[-4,4,-1,2,3,0], aux:[{sprite:1,x:37,y:49,scale:.4},{sprite:0,x:64,y:58,scale:.34},{sprite:1,x:58,y:40,scale:.28}] },
  { label: "Flooded sanctuary", sprites: [3,2,2,3,4,5], scales:[.9,.9,1.02,1.12,.84,1.05], rotations:[2,-2,0,1,-3,0], aux:[{sprite:3,x:41,y:59,scale:.42},{sprite:3,x:63,y:49,scale:.35},{sprite:2,x:55,y:42,scale:.28}] },
  { label: "Ember enclave", sprites: [4,1,2,3,4,5], scales:[.9,1.04,1.1,.84,1.08,1.02], rotations:[-2,2,0,3,-3,0], aux:[{sprite:4,x:38,y:55,scale:.44},{sprite:1,x:64,y:48,scale:.34},{sprite:4,x:56,y:64,scale:.28}] },
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
  const scale = plan.scales[index] ?? 1;
  const rotate = plan.rotations[index] ?? 0;
  return <span className={`raster-structure-shell ${className}`} style={{
    "--raster-scale": String(scale),
    "--raster-rotate": `${rotate}deg`,
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
  const visibleAux = Math.min(plan.aux.length, Math.max(0, completed - 1));
  return <span className={`district-raster-stack${compact ? " is-compact" : ""}`} data-city-plan={plan.label}>
    <img className="district-raster-art island-terrain" src="/world-island.png" width={1536} height={1024} alt="" draggable={false}/>
    <span className="district-raster-lighting" aria-hidden="true"/>
    <span className="district-raster-aux" aria-hidden="true">
      {plan.aux.slice(0, visibleAux).map((item, index) => <span key={index} className="district-aux-structure" style={{
        left: `${item.x}%`, top: `${item.y}%`, "--aux-scale": String(item.scale), "--aux-rotate": `${item.rotate ?? 0}deg`, opacity: power < 35 ? .42 : .82,
      } as CSSProperties}><span className="structure-sprite raster-structure-sprite" style={spriteVars(item.sprite)}/></span>)}
    </span>
  </span>;
}
