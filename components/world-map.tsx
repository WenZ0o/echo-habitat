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
const DISTRICTS_PER_PAGE = 6;
const LANDSCAPES = [
  { name: "Fern hollow", filter: "hue-rotate(18deg) saturate(1.2)", tint: "#21432a" },
  { name: "Amber ridge", filter: "sepia(.38) saturate(1.25)", tint: "#493c23" },
  { name: "Silver shore", filter: "saturate(.35) brightness(1.16)", tint: "#344447" },
  { name: "Heather rise", filter: "hue-rotate(295deg) saturate(.65)", tint: "#433247" },
  { name: "Sunlit meadow", filter: "hue-rotate(-12deg) brightness(1.1)", tint: "#414723" },
];
function landscape(district: number) { return LANDSCAPES[(district - 1) % LANDSCAPES.length]; }
// Reuse the six terrain clearings, with a stable arrangement for each district.
function buildingPosition(id: BlueprintId, district: number) {
  const index = ORDER.indexOf(id);
  const slot = index === 5 ? 5 : (index + district - 1) % 5;
  return BLUEPRINTS.find(item => item.id === ORDER[slot])!;
}
function residentPosition(position: { x: number; y: number }, district: number) {
  if (!district) return position;
  const nearest = BLUEPRINTS.reduce((best, item) =>
    Math.hypot(item.x - position.x, item.y - position.y) <
    Math.hypot(best.x - position.x, best.y - position.y) ? item : best);
  const target = buildingPosition(nearest.id, district);
  return { x: position.x + target.x - nearest.x, y: position.y + target.y - nearest.y };
}

export function WorldMap({ world, selected, onSelect }: { world: World; selected: ResidentId; onSelect: (id: ResidentId) => void }) {
  const latest = districtOf(world);
  const [browsing, setBrowsing] = useState<number | null>(null);
  const [detail, setDetail] = useState<BlueprintId | null>(null);
  const [overview, setOverview] = useState(true);
  const [overviewPage, setOverviewPage] = useState<number | null>(null);
  const district = Math.min(latest, browsing ?? latest);
  const project = world.settlement.project?.district === district ? world.settlement.project : null;
  const viewed = detail ? BLUEPRINTS.find(item => item.id === detail) : null;
  const totalBuilt = Object.values(world.settlement.built).reduce((sum, count) => sum + count, 0);
  const districtBuilt = BLUEPRINTS.filter(item => world.settlement.built[item.id] >= district).length;
  const lastPage = Math.floor((latest - 1) / DISTRICTS_PER_PAGE);
  const page = Math.min(lastPage, overviewPage ?? Math.floor((district - 1) / DISTRICTS_PER_PAGE));
  const firstDistrict = page * DISTRICTS_PER_PAGE + 1;
  const visibleDistricts = Array.from({ length: Math.min(DISTRICTS_PER_PAGE, latest - firstDistrict + 1) }, (_, index) => firstDistrict + index);
  function browse(value: number) {
    if (!Number.isFinite(value)) return;
    setBrowsing(Math.max(1, Math.min(latest, Math.floor(value))));
    setDetail(null); setOverviewPage(null);
  }
  function follow() { setBrowsing(null); setDetail(null); setOverviewPage(null); }
  return <div className="world-map">
    <div className="map-navigation">
      <div><span className="eyebrow">THE ARCHIPELAGO</span><strong>{latest} {latest === 1 ? "district" : "districts"} · {totalBuilt} buildings</strong></div>
      <div className="map-pagination"><button className="overview-toggle" onClick={() => setOverview(value => !value)} aria-expanded={overview}>{overview ? "Hide islands" : "Show islands"}</button><button aria-label="Previous district" disabled={district <= 1} onClick={() => browse(district - 1)}><ArrowLeft size={15}/></button><label>District <input aria-label="Go to district" type="number" min={1} max={latest} key={district} defaultValue={district} onBlur={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value > 0) { event.target.value = String(Math.min(latest, value)); browse(value); } else event.target.value = String(district); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}/></label><button aria-label="Next district" disabled={district >= latest} onClick={() => browse(district + 1)}><ArrowRight size={15}/></button><button className="follow-work" onClick={follow} aria-pressed={browsing === null}><Focus size={14}/>Follow work</button></div>
    </div>


      <div className="district-context">
        <strong>{browsing === null ? "Live view" : "Exploring"} · District {district} · {landscape(district).name}</strong>
        <span>{totalBuilt - districtBuilt} buildings remain on other islands. {browsing === null ? "Following Moss, Lux and Echo as the world grows." : "This view stays here while the world grows."}</span>
      </div>
    <div className={`world-scene archipelago-scene ${world.weather === "rain" ? "raining" : ""} ${world.power < 35 ? "low-power" : ""} ${world.clock.running ? "clock-running" : ""}`}>
      <div className="home-island" style={{ left: `${HOME.left}%`, top: `${HOME.top}%`, width: `${HOME.width}%` }}><img className="habitat-art" src="/habitat.png" width={1536} height={1024} alt="Their first home: a grove, reflection pool and glowing observatory beneath a glass dome." fetchPriority="high"/><span className="island-name">The first home</span></div>
      <div className="growing-island" style={{ left: `${DISTRICT.left}%`, top: `${DISTRICT.top}%`, width: `${DISTRICT.width}%` }}>
        <img style={{ filter: `${landscape(district).filter}${world.power < 35 ? " brightness(.55)" : ""}` }} className="island-terrain" src="/world-island.png" width={1536} height={1024} alt={`Island district ${district}, with six clearings for the settlement.`}/>
        {BLUEPRINTS.map(blueprint => {
          const complete = world.settlement.built[blueprint.id] >= district;
          const active = project?.blueprint === blueprint.id;
          const progress = active ? Math.floor(100 * project.work / workRequired(blueprint, district)) : complete ? 100 : 0;
          const phase = progress < 34 ? "foundation" : progress < 72 ? "frame" : "finishing";
          const index = ORDER.indexOf(blueprint.id);
          return <button key={blueprint.id} className={`map-structure ${complete ? "complete" : active ? phase : "clearing"} ${detail === blueprint.id ? "selected" : ""}`}
            style={{ left: `${buildingPosition(blueprint.id, district).x}%`, top: `${buildingPosition(blueprint.id, district).y}%`, "--sprite-x": `${index % 3 * 50}%`, "--sprite-y": `${Math.floor(index / 3) * 100}%`, "--completion": `${progress}%` } as CSSProperties}
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
      <div className="scene-caption">{viewed ? `${viewed.name} · ${viewed.benefit}` : "Select a resident or a building to look closer."}</div>
    </div>
    <details className="district-buildings"><summary>Buildings in this district · {districtBuilt}/6 complete</summary><div className="district-building-list" aria-label={`Buildings in district ${district}`}>
      {BLUEPRINTS.map(blueprint => <button key={blueprint.id} onClick={() => setDetail(value => value === blueprint.id ? null : blueprint.id)} aria-pressed={detail === blueprint.id}>
        <strong>{blueprint.name}</strong><span>{world.settlement.built[blueprint.id] >= district ? "Complete" : project?.blueprint === blueprint.id ? "Under construction" : "Not built yet"}</span>
      </button>)}
    </div>
    </details>
    <div className="map-activity" aria-label="Where everyone is">{world.residents.map(resident => <button key={resident.id} onClick={() => { onSelect(resident.id); if (resident.district) browse(resident.district); else follow(); }} style={{ "--resident": PROFILES[resident.id].color } as CSSProperties}><i/><strong>{PROFILES[resident.id].name}</strong><span>{resident.district ? `District ${resident.district}` : PLACES[resident.location].name}</span></button>)}</div>
    {overview && <section className="archipelago-overview" aria-label="World overview">
      <div className="archipelago-summary">
        <strong>Explore the archipelago</strong>
        <p>Completed buildings stay on their islands. Select a district to view it above. Follow work returns to the residents.</p>
      </div>
      <div className="overview-home"><img src="/habitat.png" width={1536} height={1024} alt="" /><span>The first home<small>Where their story began</small></span></div>
      <div className="overview-islands">
        {visibleDistricts.map(number => {
          const count = BLUEPRINTS.filter(item => world.settlement.built[item.id] >= number).length;
          const activeProject = world.settlement.project?.district === number ? world.settlement.project : null;
          const inhabitants = world.residents.filter(item => item.district === number);
          return <button key={number} className="overview-island" style={{ "--island-tint": landscape(number).tint } as CSSProperties} onClick={() => browse(number)}
            aria-label={`Explore district ${number}: ${count} of 6 buildings complete`}>
            <span className="overview-terrain" aria-hidden="true">
              <img src="/world-island.png" style={{ filter: landscape(number).filter }} width={1536} height={1024} alt="" loading="lazy"/>
              {BLUEPRINTS.map(blueprint => {
                const complete = world.settlement.built[blueprint.id] >= number;
                const active = activeProject?.blueprint === blueprint.id;
                if (!complete && !active) return null;
                const index = ORDER.indexOf(blueprint.id);
                return <span key={blueprint.id} className={`overview-building ${active ? "in-progress" : ""}`} style={{
                  left: `${buildingPosition(blueprint.id, number).x}%`, top: `${buildingPosition(blueprint.id, number).y}%`,
                  "--sprite-x": `${index % 3 * 50}%`, "--sprite-y": `${Math.floor(index / 3) * 100}%`,
                } as CSSProperties}><span className="structure-sprite"/></span>;
              })}
            </span>
            <strong>District {number} · {landscape(number).name}</strong>
            <span>{count}/6 built · {number < latest ? "Established" : activeProject ? "Building" : "Growing"}</span>
            <small>{inhabitants.length ? inhabitants.map(item => PROFILES[item.id].name).join(" · ") : "Open to explore"}</small>
          </button>;
        })}
      </div>
      <div className="overview-pagination">
        <button disabled={page === 0} onClick={() => setOverviewPage(page - 1)} aria-label="Earlier islands"><ArrowLeft size={15}/>Earlier</button>
        <span>Districts {firstDistrict}–{Math.min(latest, firstDistrict + DISTRICTS_PER_PAGE - 1)} of {latest}</span>
        <button disabled={page >= lastPage} onClick={() => setOverviewPage(page + 1)} aria-label="Later islands">Later<ArrowRight size={15}/></button>
      </div>
      <button className="overview-latest" onClick={() => setOverviewPage(lastPage)}>Show newest islands</button>
    </section>}
  </div>;
}
