"use client";

import type { CSSProperties } from "react";
import { Check, Compass, Droplets, Flower2, Hammer, Layers3, Route, Sparkles, Sprout, Sun, TowerControl, Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BLUEPRINTS, blueprintCost, districtOf, nextBlueprint, RESOURCE_IDS, RESOURCES, workRequired } from "@/lib/habitat/construction";
import { PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { BlueprintId, World } from "@/lib/habitat/types";

const BUILDING_ICONS = { garden: Flower2, solar: Sun, lookout: TowerControl, cistern: Droplets, workshop: Hammer, bridge: Route };
const RESOURCE_ICONS = { biomass: Sprout, salvage: Wrench, insight: Sparkles };
export function habitatStage(world: World) { return world.settlement.built.bridge ? 2 : world.settlement.built.lookout ? 1 : 0; }

export function BuildingMarkers({ world }: { world: World }) {
  const stage = habitatStage(world);
  const coordinates: Record<BlueprintId, [number, number]> = {
    garden: [stage === 2 ? 49 : 53, 64], solar: [stage === 2 ? 72 : 78, 62],
    lookout: [stage === 2 ? 12 : 16, 29], cistern: [19, 56], workshop: [85, 46], bridge: [87, 60],
  };
  return <div className="building-markers" aria-label="Completed structures and current construction">
    {BLUEPRINTS.filter(b => world.settlement.built[b.id] || world.settlement.project?.blueprint === b.id).map(b => {
      const active = world.settlement.project?.blueprint === b.id;
      const Icon = active ? Hammer : BUILDING_ICONS[b.id];
      const [x, y] = coordinates[b.id];
      const label = `${b.name}: ${world.settlement.built[b.id]} built${active ? ", another under construction" : ""}`;
      return <span key={b.id} role="img" aria-label={label} title={label} className={`building-pin ${active ? "under-construction" : ""}`}
        style={{ left: `${50 + (x - 50) * (1.5 / 1.72)}%`, top: `${y}%` }}>
        <Icon size={13} strokeWidth={1.6}/>{active ? <span className="construction-dot"/> : <span>{world.settlement.built[b.id]}</span>}
      </span>;
    })}
  </div>;
}

export function ConstructionBoard({ world }: { world: World }) {
  const { project, resources, built } = world.settlement;
  const district = districtOf(world), total = Object.values(built).reduce((a, b) => a + b, 0);
  const blueprint = project ? BLUEPRINTS.find(b => b.id === project.blueprint)! : nextBlueprint(world);
  const cost = blueprintCost(blueprint, project?.district ?? district);
  const required = workRequired(blueprint, project?.district ?? district);
  const materialTotal = RESOURCE_IDS.reduce((sum, id) => sum + cost[id], 0);
  const available = RESOURCE_IDS.reduce((sum, id) => sum + Math.min(resources[id], cost[id]), 0);
  const progress = Math.floor(100 * (project ? project.work / required : available / materialTotal));
  const Icon = BUILDING_ICONS[blueprint.id];
  const lastDistricts = Array.from({ length: Math.min(district, 5) }, (_, i) => district - Math.min(district, 5) + i + 1);
  return <section className="construction-section" aria-labelledby="construction-heading">
    <div className="section-label"><h2 id="construction-heading">A world they build <span>{String(total).padStart(2, "0")}</span></h2><span>District {String(district).padStart(2, "0")}</span></div>
    <div className="construction-panel">
      <div className="resource-stores" aria-label="Shared materials">
        {RESOURCE_IDS.map(id => {
          const ResourceIcon = RESOURCE_ICONS[id];
          return <div key={id}><ResourceIcon size={17} style={{ color: PROFILES[RESOURCES[id].lead].color }}/><span>{RESOURCES[id].name}<small>{PROFILES[RESOURCES[id].lead].name} gathers</small></span><strong>{resources[id]}</strong></div>;
        })}
      </div>
      <div className="current-project" style={{ "--builder": PROFILES[blueprint.lead].color } as CSSProperties}>
        <div className="project-heading"><span className="project-icon"><Icon size={25} strokeWidth={1.4}/></span><div><span className="eyebrow">{project ? "TAKING SHAPE" : "THE NEXT IDEA"}</span><h3>{blueprint.name}</h3></div><span className="project-phase">{project ? "Building" : "Gathering"}</span></div>
        <p className="project-description">{blueprint.description}</p>
        <div className="project-progress-label"><span>{project ? `${project.work} / ${required} work · materials reserved` : "Materials gathered"}</span><strong>{progress}%</strong></div>
        <Progress value={progress} aria-label={`${blueprint.name}: ${project ? "construction" : "materials"} progress`}/>
        {project ? <div className="contributions" aria-label="Work contributed by each resident">{RESIDENT_IDS.map(id => <span key={id} style={{ color: PROFILES[id].color }}>{PROFILES[id].name}<strong>{project.contributions[id]}</strong></span>)}</div>
          : <p className="material-needs">Needed: {RESOURCE_IDS.filter(id => cost[id] > 0).map(id => `${Math.min(resources[id], cost[id])}/${cost[id]} ${RESOURCES[id].name.toLowerCase()}`).join(" · ")}</p>}
        <p className="project-note"><span className="status-dot running"/>{world.intervention?.kind === "blackout" ? "Power and looking after each other come first." : `${PROFILES[blueprint.lead].name} leads. All three gather and build on their own.`}</p>
      </div>
      <div className="blueprint-grid" aria-label={`Building plans for district ${district}`}>
        {BLUEPRINTS.map(b => {
          const BuildingIcon = BUILDING_ICONS[b.id];
          const finished = built[b.id] >= district, active = blueprint.id === b.id;
          return <div key={b.id} className={`blueprint ${finished ? "finished" : active ? "current" : ""}`}>
            <div><BuildingIcon size={17}/><span>{finished ? <Check size={14}/> : active ? (project ? "Building" : "Gathering") : "Planned"}</span></div>
            <h4>{b.name}</h4><p>{b.benefit}</p><small>{built[b.id]} built · {PROFILES[b.lead].name}</small>
          </div>;
        })}
      </div>
      <div className="district-trail" aria-label={`${district} districts reached`}>
        <div><Compass size={15}/><span>Beyond the first habitat</span></div>
        <ol>{district > 5 && <li className="older-districts">+{district - 5} established</li>}{lastDistricts.map(n => <li key={n} className={n === district ? "settling" : "established"}>{n < district ? <Check size={12}/> : <Layers3 size={12}/>}<span>{String(n).padStart(2, "0")}</span><small>{n === district ? "Settling" : "Established"}</small></li>)}</ol>
        <p>Every bridge opens a new district. Their next beginning is already taking shape.</p>
      </div>
    </div>
  </section>;
}
