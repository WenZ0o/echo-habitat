import type { CSSProperties } from "react";
import type { BlueprintId } from "@/lib/habitat/types";

const ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];

type Aux = { x: number; y: number; scale: number; rotate?: number };
type CityPlan = {
  label: string;
  family: string;
  aux: Aux[];
};
type AssetRecipe = {
  assetId: string;
  primary: number;
  annex: number;
  crown: number;
  scale: number;
  rotate: number;
  annexX: number;
  annexY: number;
  annexScale: number;
  crownX: number;
  crownY: number;
  crownScale: number;
  mirror: boolean;
  hue: number;
};

const CITY_PLANS: CityPlan[] = [
  { label: "Mossward", family: "grove", aux: [{x:35,y:58,scale:.42},{x:66,y:59,scale:.34},{x:57,y:44,scale:.28},{x:72,y:49,scale:.23}] },
  { label: "Helios Reach", family: "solar", aux: [{x:40,y:48,scale:.40},{x:62,y:58,scale:.36},{x:70,y:43,scale:.30},{x:52,y:64,scale:.23}] },
  { label: "Tidelock", family: "water", aux: [{x:39,y:61,scale:.42},{x:63,y:49,scale:.34},{x:55,y:39,scale:.27},{x:72,y:59,scale:.22}] },
  { label: "Reliquary", family: "archive", aux: [{x:42,y:47,scale:.43},{x:64,y:54,scale:.34},{x:54,y:63,scale:.28},{x:35,y:60,scale:.23}] },
  { label: "Cinderworks", family: "forge", aux: [{x:37,y:57,scale:.44},{x:63,y:45,scale:.34},{x:55,y:65,scale:.27},{x:71,y:58,scale:.22}] },
  { label: "Terravale", family: "terrace", aux: [{x:40,y:50,scale:.39},{x:61,y:57,scale:.33},{x:69,y:45,scale:.26},{x:35,y:63,scale:.22}] },
  { label: "Lumen Ridge", family: "glass", aux: [{x:39,y:55,scale:.42},{x:65,y:51,scale:.35},{x:55,y:40,scale:.27},{x:71,y:62,scale:.22}] },
  { label: "Galehaven", family: "wind", aux: [{x:37,y:49,scale:.40},{x:64,y:58,scale:.34},{x:58,y:40,scale:.28},{x:72,y:48,scale:.22}] },
  { label: "Drowned Sanctum", family: "sanctuary", aux: [{x:41,y:59,scale:.42},{x:63,y:49,scale:.35},{x:55,y:42,scale:.28},{x:35,y:52,scale:.22}] },
  { label: "Ember Bloom", family: "ember", aux: [{x:38,y:55,scale:.44},{x:64,y:48,scale:.34},{x:56,y:64,scale:.28},{x:72,y:57,scale:.22}] },
];

const SPRITE_TRIPLES: [number, number, number][] = [];
for (let primary = 0; primary < 6; primary++) {
  for (let annex = 0; annex < 6; annex++) {
    if (annex === primary) continue;
    for (let crown = 0; crown < 6; crown++) {
      if (crown === primary || crown === annex) continue;
      SPRITE_TRIPLES.push([primary, annex, crown]);
    }
  }
}

function hash(value: number, salt: number) {
  const x = Math.sin((value + 1) * 12.9898 + salt * 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function structureAssetIndex(district: number, id: BlueprintId) {
  return (Math.max(1, district) - 1) * 12 + ORDER.indexOf(id);
}

function auxAssetIndex(district: number, index: number) {
  return (Math.max(1, district) - 1) * 12 + 6 + index;
}

export function worldAssetId(assetIndex: number) {
  return `world-structure-${String(assetIndex + 1).padStart(3, "0")}`;
}

export function assetRecipe(assetIndex: number): AssetRecipe {
  const triple = SPRITE_TRIPLES[assetIndex % SPRITE_TRIPLES.length];
  const generation = Math.floor(assetIndex / SPRITE_TRIPLES.length);
  return {
    assetId: worldAssetId(assetIndex),
    primary: triple[0], annex: triple[1], crown: triple[2],
    scale: .88 + hash(assetIndex, 3) * .22,
    rotate: -5 + hash(assetIndex, 5) * 10,
    annexX: 12 + hash(assetIndex, 7) * 58,
    annexY: 42 + hash(assetIndex, 11) * 28,
    annexScale: .24 + hash(assetIndex, 13) * .18,
    crownX: 30 + hash(assetIndex, 17) * 40,
    crownY: 8 + hash(assetIndex, 19) * 26,
    crownScale: .18 + hash(assetIndex, 23) * .16,
    mirror: hash(assetIndex, 29) > .5,
    hue: generation * 13 + Math.round((hash(assetIndex, 31) - .5) * 8),
  };
}

export function districtCityPlan(district: number): CityPlan {
  if (district <= CITY_PLANS.length) return CITY_PLANS[Math.max(1, district) - 1];
  const n = Math.max(11, district);
  return {
    label: `Frontier ${String(n).padStart(2, "0")}`,
    family: `frontier-${n}`,
    aux: [0, 1, 2, 3].map(index => ({
      x: 34 + hash(n * 10 + index, 37) * 40,
      y: 41 + hash(n * 10 + index, 41) * 25,
      scale: .22 + hash(n * 10 + index, 43) * .2,
      rotate: -9 + hash(n * 10 + index, 47) * 18,
    })),
  };
}

function spriteVars(sprite: number) {
  return {
    "--sprite-x": `${sprite % 3 * 50}%`,
    "--sprite-y": `${Math.floor(sprite / 3) * 100}%`,
  } as CSSProperties;
}

function UniqueRasterAsset({ assetIndex, className = "" }: { assetIndex: number; className?: string }) {
  const recipe = assetRecipe(assetIndex);
  const css = {
    "--raster-scale": String(recipe.scale),
    "--raster-rotate": `${recipe.rotate}deg`,
    "--annex-x": `${recipe.annexX}%`,
    "--annex-y": `${recipe.annexY}%`,
    "--annex-scale": String(recipe.annexScale),
    "--crown-x": `${recipe.crownX}%`,
    "--crown-y": `${recipe.crownY}%`,
    "--crown-scale": String(recipe.crownScale),
    "--asset-mirror": recipe.mirror ? -1 : 1,
    "--asset-hue": `${recipe.hue}deg`,
  } as CSSProperties;
  return <span className={`raster-structure-shell unique-world-asset ${className}`} data-world-asset={recipe.assetId} style={css}>
    <span className="structure-sprite raster-structure-sprite raster-primary" style={spriteVars(recipe.primary)}/>
    <span className="raster-annex"><span className="structure-sprite raster-structure-sprite" style={spriteVars(recipe.annex)}/></span>
    <span className="raster-crown"><span className="structure-sprite raster-structure-sprite" style={spriteVars(recipe.crown)}/></span>
  </span>;
}

export function DistrictRasterStructure({ id, district, progress = 100, className = "" }: {
  id: BlueprintId;
  district: number;
  progress?: number;
  className?: string;
}) {
  return <span className="district-unique-structure" style={{ "--raster-progress": `${Math.max(0, Math.min(100, progress))}%` } as CSSProperties}>
    <UniqueRasterAsset assetIndex={structureAssetIndex(district, id)} className={className}/>
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
  return <span className={`district-raster-stack district-kit-${plan.family}${compact ? " is-compact" : ""}`} data-city-plan={plan.label}>
    <img className="district-raster-art island-terrain" src="/world-island.png" width={1536} height={1024} alt="" draggable={false}/>
    <span className="district-raster-lighting" aria-hidden="true"/>
    <span className="district-raster-aux" aria-hidden="true">
      {plan.aux.slice(0, visibleAux).map((item, index) => <span key={index} className="district-aux-structure" style={{
        left: `${item.x}%`, top: `${item.y}%`, "--aux-scale": String(item.scale), "--aux-rotate": `${item.rotate ?? 0}deg`, opacity: power < 35 ? .42 : .86,
      } as CSSProperties}><UniqueRasterAsset assetIndex={auxAssetIndex(district, index)}/></span>)}
    </span>
  </span>;
}

// Exact rendered recipes are globally unique: every visible main/aux structure receives
// its own monotonically increasing asset index and therefore its own composite recipe.
if (process.env.NODE_ENV !== "production") {
  const sample = Array.from({ length: 120 }, (_, index) => assetRecipe(index));
  const signatures = sample.map(item => `${item.primary}-${item.annex}-${item.crown}`);
  if (new Set(signatures).size !== signatures.length) throw new Error("Duplicate world structure recipe detected");
}
