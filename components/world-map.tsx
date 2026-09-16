"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, CloudRain, Focus, Hammer, Sprout, Sun, Wrench, Sparkles } from "lucide-react";
import { BLUEPRINTS, districtOf, RESOURCES, workRequired } from "@/lib/habitat/construction";
import { PLACES, PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import { biome, buildingPosition, residentPosition } from "./island-terrain";
import { districtArchitecture, districtStructure } from "./district-architecture";
import { DistrictRasterIsland, DistrictRasterStructure, districtCityPlan } from "./district-raster";
import { WorldAtlas } from "./world-atlas";
import type { BlueprintId, ResidentId, World } from "@/lib/habitat/types";

const RESOURCE_ICON = { biomass: Sprout, salvage: Wrench, insight: Sparkles };
const HOME = { left: -12, top: 2, width: 82 };
const DISTRICT = { left: 37, top: 34, width: 72 };

export function WorldMap({ world, selected, onSelect }: { world: World; selected: ResidentId; onSelect: (id: ResidentId) => void }) {
  const latest = districtOf(world);
  const [browsing, setBrowsing] = useState<number | null>(null);
  const [detail, setDetail] = useState<BlueprintId | null>(null);
  const [overview, setOverview] = useState(true);
  const detailAnchor = useRef<HTMLDivElement>(null);
  const district = Math.min(latest, browsing ?? latest);
  const project = world.settlement.project?.district === district ? world.settlement.project : null;
  const viewed = detail ? BLUEPRINTS.find(item => item.id === detail) : null;
  const viewedIdentity = detail ? districtStructure(detail, district) : null;
  const architecture = districtArchitecture(district);
  const cityPlan = districtCityPlan(district);
  const totalBuilt = Object.values(world.settlement.built).reduce((sum, count) => sum + count, 0);
  const districtBuilt = BLUEPRINTS.filter(item => world.settlement.built[item.id] >= district).length;

  function browse(value: number) {
    if (!Number.isFinite(value)) return;
    setBrowsing(Math.max(1, Math.min(latest, Math.floor(value))));
    setDetail(null);
  }

  function follow() {
    setBrowsing(null);
    setDetail(null);
  }

  return <div className="world-map">
    <div className="map-navigation">
      <div><span className="eyebrow">THE ARCHIPELAGO</span><strong>{latest} {latest === 1 ? "district" : "districts"} · {totalBuilt} structures</strong></div>
      <div className="map-pagination">
        <button className="overview-toggle" onClick={() => setOverview(value => !value)} aria-expanded={overview}>{overview ? "Hide world map" : "Show world map"}</button>
        <button aria-label="Previous district" disabled={district <= 1} onClick={() => browse(district - 1)}><ArrowLeft size={15}/></button>
        <label>District <input aria-label="Go to district" type="number" min={1} max={latest} key={district} defaultValue={district} onBlur={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value > 0) { event.target.value = String(Math.min(latest, value)); browse(value); } else event.target.value = String(district); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}/></label>
        <button aria-label="Next district" disabled={district >= latest} onClick={() => browse(district + 1)}><ArrowRight size={15}/></button>
        <button className="follow-work" onClick={follow} aria-pressed={browsing === null}><Focus size={14}/>Follow work</button>
      </div>
    </div>

    {overview && <WorldAtlas world={world} selected={selected} onSelect={onSelect} onDistrict={value => { browse(value); detailAnchor.current?.scrollIntoView({ block: "start" }); }}/>} 

    <div ref={detailAnchor} className="district-context district-context-premium">
      <div>
        <span className="district-context-kicker">{browsing === null ? "LIVE DISTRICT" : "EXPLORING"}</span>
        <strong>District {String(district).padStart(2, "0")} · {biome(district).name}</strong>
      </div>
      <div className="district-architecture-copy">
        <b>{architecture.title}</b>
        <span>{cityPlan.label} · {architecture.style}</span>
        <p>{architecture.description}</p>
      </div>
    </div>

    <div className={`world-scene archipelago-scene photoreal-district-scene ${world.weather === "rain" ? "raining" : ""} ${world.power < 35 ? "low-power" : ""} ${world.clock.running ? "clock-running" : ""}`}>
      <div className="home-island" style={{ left: `${HOME.left}%`, top: `${HOME.top}%`, width: `${HOME.width}%` }}>
        <img className="habitat-art" src="/habitat.png" width={1536} height={1024} alt="Their first home: a grove, reflection pool and glowing observatory beneath a glass dome." fetchPriority="high"/>
        <span className="island-name">The first home</span>
      </div>

      <div className="growing-island raster-growing-island" style={{ left: `${DISTRICT.left}%`, top: `${DISTRICT.top}%`, width: `${DISTRICT.width}%` }}>
        <DistrictRasterIsland district={district} completed={districtBuilt} power={world.power}/>
        {BLUEPRINTS.map(blueprint => {
          const complete = world.settlement.built[blueprint.id] >= district;
          const active = project?.blueprint === blueprint.id;
          const progress = active ? Math.floor(100 * project.work / workRequired(blueprint, district)) : complete ? 100 : 0;
          const phase = progress < 34 ? "foundation" : progress < 72 ? "frame" : "finishing";
          const identity = districtStructure(blueprint.id, district);
          return <button key={blueprint.id} className={`map-structure custom-structure ${complete ? "complete" : active ? phase : "clearing"} ${detail === blueprint.id ? "selected" : ""}`}
            style={{ left: `${buildingPosition(blueprint.id, district).x}%`, top: `${buildingPosition(blueprint.id, district).y}%`, "--completion": `${progress}%` } as CSSProperties}
            onClick={() => setDetail(value => value === blueprint.id ? null : blueprint.id)} aria-pressed={detail === blueprint.id}
            aria-label={`${identity.name}, district ${district}: ${complete ? "complete" : active ? `${phase}, ${progress}% built` : "future site"}`}>
            <span className="building-footprint"/>
            {(complete || active) && <DistrictRasterStructure id={blueprint.id} district={district} progress={progress}/>} 
            {active && <span className="construction-label"><Hammer size={10}/>{progress}%</span>}
          </button>;
        })}
        <span className="island-name district-name">District {String(district).padStart(2, "0")} · {architecture.title.replace("The ", "")}</span>
      </div>

      {world.residents.filter(resident => resident.district === 0 || resident.district === district).map(resident => {
        const bounds = resident.district === 0 ? HOME : DISTRICT;
        const position = residentPosition(resident.position, resident.district);
        const x = bounds.left + position.x * bounds.width / 100;
        const y = bounds.top + position.y * bounds.width / 100 * 1.45 / 1.5;
        const Carry = resident.carrying ? RESOURCE_ICON[resident.carrying] : null;
        return <button key={resident.id} className={`map-resident ${selected === resident.id ? "selected" : ""} ${resident.carrying ? "carrying" : ""}`} style={{ left: `${x}%`, top: `${y}%`, "--resident": PROFILES[resident.id].color, "--robot-x": `${RESIDENT_IDS.indexOf(resident.id) * 50}%` } as CSSProperties}
          onClick={() => onSelect(resident.id)} aria-pressed={selected === resident.id} title={resident.activity} aria-label={`Observe ${PROFILES[resident.id].name}: ${resident.activity}${resident.carrying ? `, carrying ${RESOURCES[resident.carrying].name.toLowerCase()}` : ""}`}>
          <span className="robot-sprite"/><span className="robot-label">{PROFILES[resident.id].name}{Carry && <Carry size={12}/>}</span>
        </button>;
      })}

      <div className="weather-badge">{world.weather === "rain" ? <CloudRain size={15}/> : <Sun size={15}/>}<span>{world.weather === "rain" ? "Gentle rain" : "Clear skies"}</span></div>
      <div className="scene-caption">{viewed && viewedIdentity ? <><strong>{viewedIdentity.name}</strong><span>{viewedIdentity.description} · {viewed.benefit}</span></> : <><strong>{architecture.title}</strong><span>{cityPlan.label}. The city grows on the same physical world art as Origin instead of a separate sketch layer.</span></>}</div>
    </div>

    <details className="district-buildings district-buildings-premium">
      <summary>Structures unique to {biome(district).shortName} · {districtBuilt}/6 complete</summary>
      <div className="district-building-list" aria-label={`Structures in district ${district}`}>
        {BLUEPRINTS.map(blueprint => {
          const identity = districtStructure(blueprint.id, district);
          const progress = world.settlement.built[blueprint.id] >= district ? 100 : project?.blueprint === blueprint.id ? Math.floor(100 * project.work / workRequired(blueprint, district)) : 0;
          return <button key={blueprint.id} onClick={() => setDetail(value => value === blueprint.id ? null : blueprint.id)} aria-pressed={detail === blueprint.id}>
            <span className="district-list-art">{progress > 0 && <DistrictRasterStructure id={blueprint.id} district={district} progress={progress}/>}</span>
            <span className="district-list-copy"><strong>{identity.name}</strong><small>{identity.description}</small><em>{world.settlement.built[blueprint.id] >= district ? "Complete" : project?.blueprint === blueprint.id ? "Under construction" : "Future site"}</em></span>
          </button>;
        })}
      </div>
    </details>

    <div className="map-activity" aria-label="Where everyone is">{world.residents.map(resident => <button key={resident.id} onClick={() => { onSelect(resident.id); if (resident.district) browse(resident.district); else follow(); }} style={{ "--resident": PROFILES[resident.id].color } as CSSProperties}><i/><strong>{PROFILES[resident.id].name}</strong><span>{resident.district ? `District ${resident.district}` : PLACES[resident.location].name}</span></button>)}</div>
  </div>;
}
