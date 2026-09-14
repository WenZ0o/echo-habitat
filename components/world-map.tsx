"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, CloudRain, Focus, Hammer, Sprout, Sun, Wrench, Sparkles } from "lucide-react";
import { BLUEPRINTS, districtOf, RESOURCES, workRequired } from "@/lib/habitat/construction";
import { PLACES, PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { BlueprintId, ResidentId, World } from "@/lib/habitat/types";

const ORDER: BlueprintId[] = ["garden", "solar", "lookout", "cistern", "workshop", "bridge"];
const RESOURCE_ICON = { biomass: Sprout, salvage: Wrench, insight: Sparkles };
const HOME = { left: -12, top: 2, width: 82 };
const DISTRICT = { left: 37, top: 34, width: 72 };

export function WorldMap({ world, selected, onSelect }: { world: World; selected: ResidentId; onSelect: (id: ResidentId) => void }) {
  const latest = districtOf(world);
  const [browsing, setBrowsing] = useState<number | null>(null);
  const [detail, setDetail] = useState<BlueprintId | null>(null);
  const district = Math.min(latest, browsing ?? latest);
  const project = world.settlement.project?.district === district ? world.settlement.project : null;
  const viewed = detail ? BLUEPRINTS.find(item => item.id === detail) : null;
  function browse(value: number) { setBrowsing(value === latest ? null : Math.max(1, Math.min(latest, value))); setDetail(null); }
  return <div className="world-map">
    <div className="map-navigation">
      <div><span className="eyebrow">THE ARCHIPELAGO</span><strong>{latest} {latest === 1 ? "district" : "districts"} reached</strong></div>
      <div className="map-pagination"><button aria-label="Previous district" disabled={district <= 1} onClick={() => browse(district - 1)}><ArrowLeft size={15}/></button><label>District <input aria-label="Go to district" type="number" min={1} max={latest} value={district} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value > 0) browse(value); }}/></label><button aria-label="Next district" disabled={district >= latest} onClick={() => browse(district + 1)}><ArrowRight size={15}/></button><button className="follow-work" onClick={() => browse(latest)} aria-pressed={browsing === null}><Focus size={14}/>Follow work</button></div>
    </div>
    <div className={`world-scene archipelago-scene ${world.weather === "rain" ? "raining" : ""} ${world.power < 35 ? "low-power" : ""} ${world.clock.running ? "clock-running" : ""}`}>
      <div className="home-island" style={{ left: `${HOME.left}%`, top: `${HOME.top}%`, width: `${HOME.width}%` }}><img className="habitat-art" src="/habitat.png" width={1536} height={1024} alt="Their first home: a grove, reflection pool and glowing observatory beneath a glass dome." fetchPriority="high"/><span className="island-name">The first home</span></div>
      <div className="growing-island" style={{ left: `${DISTRICT.left}%`, top: `${DISTRICT.top}%`, width: `${DISTRICT.width}%` }}>
        <img className="island-terrain" src="/world-island.png" width={1536} height={1024} alt={`Island district ${district}, with six clearings for the settlement.`}/>
        {BLUEPRINTS.map(blueprint => {
          const complete = world.settlement.built[blueprint.id] >= district;
          const active = project?.blueprint === blueprint.id;
          const progress = active ? Math.floor(100 * project.work / workRequired(blueprint, district)) : complete ? 100 : 0;
          const phase = progress < 34 ? "foundation" : progress < 72 ? "frame" : "finishing";
          const index = ORDER.indexOf(blueprint.id);
          return <button key={blueprint.id} className={`map-structure ${complete ? "complete" : active ? phase : "clearing"} ${detail === blueprint.id ? "selected" : ""}`}
            style={{ left: `${blueprint.x}%`, top: `${blueprint.y}%`, "--sprite-x": `${index % 3 * 50}%`, "--sprite-y": `${Math.floor(index / 3) * 100}%`, "--completion": `${progress}%` } as CSSProperties}
            onClick={() => setDetail(value => value === blueprint.id ? null : blueprint.id)} aria-pressed={detail === blueprint.id}
            aria-label={`${blueprint.name}, district ${district}: ${complete ? "complete" : active ? `${phase}, ${progress}% built` : "empty clearing"}`}>
            <span className="building-footprint"/>{(complete || active) && <span className="structure-sprite"/>}
            {active && <span className="construction-label"><Hammer size={10}/>{progress}%</span>}
          </button>;
        })}
        <span className="island-name district-name">District {String(district).padStart(2, "0")} · {district < latest ? "Established" : "Taking root"}</span>
      </div>
      {world.residents.filter(resident => resident.district === 0 || resident.district === district).map(resident => {
        const bounds = resident.district === 0 ? HOME : DISTRICT;
        const x = bounds.left + resident.position.x * bounds.width / 100;
        const y = bounds.top + resident.position.y * bounds.width / 100 * 1.45 / 1.5;
        const Carry = resident.carrying ? RESOURCE_ICON[resident.carrying] : null;
        return <button key={resident.id} className={`map-resident ${selected === resident.id ? "selected" : ""} ${resident.carrying ? "carrying" : ""}`} style={{ left: `${x}%`, top: `${y}%`, "--resident": PROFILES[resident.id].color, "--robot-x": `${RESIDENT_IDS.indexOf(resident.id) * 50}%` } as CSSProperties}
          onClick={() => onSelect(resident.id)} aria-pressed={selected === resident.id} title={resident.activity} aria-label={`Observe ${PROFILES[resident.id].name}: ${resident.activity}${resident.carrying ? `, carrying ${RESOURCES[resident.carrying].name.toLowerCase()}` : ""}`}>
          <span className="robot-sprite"/><span className="robot-label">{PROFILES[resident.id].name}{Carry && <Carry size={12}/>}</span>
        </button>;
      })}
      <div className="weather-badge">{world.weather === "rain" ? <CloudRain size={15}/> : <Sun size={15}/>}<span>{world.weather === "rain" ? "Gentle rain" : "Clear skies"}</span></div>
      <div className="scene-caption">{viewed ? `${viewed.name} · ${viewed.benefit}` : "Select a resident or a building to look closer."}</div>
    </div>
    <div className="map-activity" aria-label="Where everyone is">{world.residents.map(resident => <button key={resident.id} onClick={() => { onSelect(resident.id); if (resident.district) browse(resident.district); }} style={{ "--resident": PROFILES[resident.id].color } as CSSProperties}><i/><strong>{PROFILES[resident.id].name}</strong><span>{resident.district ? `District ${resident.district}` : PLACES[resident.location].name}</span></button>)}</div>
  </div>;
}
