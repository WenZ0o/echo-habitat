"use client";

import type { CSSProperties } from "react";
import { Check, Compass, Droplets, Flower2, Hammer, Layers3, Route, Sparkles, Sprout, Sun, TowerControl, Users, Vote, Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BLUEPRINTS, blueprintCost, districtOf, nextBlueprint, RESOURCE_IDS, RESOURCES, workRequired } from "@/lib/habitat/construction";
import { PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { BlueprintId, ConstructionPhase, World } from "@/lib/habitat/types";

const BUILDING_ICONS = { garden: Flower2, solar: Sun, lookout: TowerControl, cistern: Droplets, workshop: Hammer, bridge: Route };
const RESOURCE_ICONS = { biomass: Sprout, salvage: Wrench, insight: Sparkles };
export function habitatStage(world: World) { return world.settlement.built.bridge ? 2 : world.settlement.built.lookout ? 1 : 0; }

function projectPhase(world: World): { phase: ConstructionPhase; progress: number } | null {
  const project = world.settlement.project;
  if (!project) return null;
  const blueprint = BLUEPRINTS.find(item => item.id === project.blueprint)!;
  const progress = Math.min(100, Math.round(project.work / workRequired(blueprint, project.district) * 100));
  return { phase: progress < 34 ? "foundation" : progress < 72 ? "frame" : "finishing", progress };
}

export function DistrictExpansions({ world }: { world: World }) {
  const opened = Math.max(0, districtOf(world) - 1);
  const bridge = world.settlement.project?.blueprint === "bridge" ? projectPhase(world) : null;
  const positions = [
    { left: 88, top: 31 }, { left: 10, top: 72 }, { left: 91, top: 72 },
    { left: 12, top: 23 }, { left: 51, top: 16 }, { left: 51, top: 82 },
  ];
  const visible = Math.min(opened, positions.length);
  return <div className="district-expansions" aria-label={`${opened} additional island districts opened`}>
    {positions.slice(0, visible).map((position, index) => <span key={index} className="district-island established" style={{ left: `${position.left}%`, top: `${position.top}%` }}>
      <span>D{String(index + 2).padStart(2, "0")}</span>
    </span>)}
    {bridge && opened < positions.length && <span className="district-island emerging" style={{ left: `${positions[opened].left}%`, top: `${positions[opened].top}%`, "--emerge": `${bridge.progress}%` } as CSSProperties}>
      <span>D{String(opened + 2).padStart(2, "0")}</span><small>{bridge.progress}%</small>
    </span>}
  </div>;
}

export function BuildingMarkers({ world }: { world: World }) {
  const stage = habitatStage(world);
  const coordinates: Record<BlueprintId, [number, number]> = {
    garden: [stage === 2 ? 49 : 53, 64], solar: [stage === 2 ? 72 : 78, 62],
    lookout: [stage === 2 ? 12 : 16, 29], cistern: [19, 56], workshop: [85, 46], bridge: [87, 60],
  };
  const phase = projectPhase(world);
  return <div className="building-markers" aria-label="Completed structures and current construction">
    {BLUEPRINTS.filter(item => world.settlement.built[item.id] || world.settlement.project?.blueprint === item.id).map(blueprint => {
      const active = world.settlement.project?.blueprint === blueprint.id;
      const Icon = active ? Hammer : BUILDING_ICONS[blueprint.id];
      const [x, y] = coordinates[blueprint.id];
      const label = `${blueprint.name}: ${world.settlement.built[blueprint.id]} built${active && phase ? `, construction ${phase.progress}% complete` : ""}`;
      return <span key={blueprint.id} role="img" aria-label={label} title={label}
        className={`building-pin ${active && phase ? `under-construction phase-${phase.phase}` : ""}`}
        style={{ left: `${50 + (x - 50) * (1.5 / 1.72)}%`, top: `${y}%`, "--site-progress": `${phase?.progress ?? 0}%` } as CSSProperties}>
        {active && <span className="construction-site-ring"/>}<Icon size={13} strokeWidth={1.6}/>
        {active && phase ? <span className="construction-percent">{phase.progress}%</span> : <span>{world.settlement.built[blueprint.id]}</span>}
      </span>;
    })}
  </div>;
}

export function ConstructionBoard({ world }: { world: World }) {
  const { project, resources, built, decision } = world.settlement;
  const district = districtOf(world);
  const total = Object.values(built).reduce((a, b) => a + b, 0);
  const blueprint = project ? BLUEPRINTS.find(item => item.id === project.blueprint)! : nextBlueprint(world);
  const cost = blueprintCost(blueprint, project?.district ?? district);
  const required = workRequired(blueprint, project?.district ?? district);
  const materialTotal = RESOURCE_IDS.reduce((sum, id) => sum + cost[id], 0);
  const available = RESOURCE_IDS.reduce((sum, id) => sum + Math.min(resources[id], cost[id]), 0);
  const progress = Math.floor(100 * (project ? project.work / required : available / materialTotal));
  const phase = projectPhase(world);
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

      {decision && <div className="council-card" aria-label="Latest shared decision">
        <div className="council-heading"><span className="council-icon"><Users size={18}/></span><div><span className="eyebrow"><Vote size={12}/> SHARED DECISION</span><strong>{BLUEPRINTS.find(item => item.id === decision.chosen)?.name}</strong></div><small>Cycle {decision.tick}</small></div>
        <p>{decision.summary}</p>
        <div className="council-votes">{RESIDENT_IDS.map(id => <span key={id} style={{ "--resident": PROFILES[id].color } as CSSProperties}><i/>{PROFILES[id].name}<b>→</b>{BLUEPRINTS.find(item => item.id === decision.votes[id])?.name}</span>)}</div>
        {decision.reasons && <div className="council-reasons">{RESIDENT_IDS.map(id => <p key={id} style={{ "--resident": PROFILES[id].color } as CSSProperties}><strong>{PROFILES[id].name}&apos;s reason</strong>{decision.reasons?.[id]}</p>)}</div>}
      </div>}

      <div className="current-project" style={{ "--builder": PROFILES[blueprint.lead].color } as CSSProperties}>
        <div className="project-heading"><span className="project-icon"><Icon size={25} strokeWidth={1.4}/></span><div><span className="eyebrow">{project ? "TAKING SHAPE" : "THE NEXT IDEA"}</span><h3>{blueprint.name}</h3></div><span className="project-phase">{project && phase ? phase.phase : "Gathering"}</span></div>
        <p className="project-description">{blueprint.description}</p>
        <div className="project-progress-label"><span>{project ? `${project.work} / ${required} work · materials reserved` : "Materials gathered"}</span><strong>{progress}%</strong></div>
        <Progress value={progress} aria-label={`${blueprint.name}: ${project ? "construction" : "materials"} progress`}/>
        {project ? <div className="contributions" aria-label="Work contributed by each resident">{RESIDENT_IDS.map(id => <span key={id} style={{ color: PROFILES[id].color }}>{PROFILES[id].name}<strong>{project.contributions[id]}</strong></span>)}</div>
          : <p className="material-needs">Needed: {RESOURCE_IDS.filter(id => cost[id] > 0).map(id => `${Math.min(resources[id], cost[id])}/${cost[id]} ${RESOURCES[id].name.toLowerCase()}`).join(" · ")}</p>}
        <p className="project-note"><span className="status-dot running"/>{world.intervention?.kind === "blackout" ? "Power and looking after each other come first." : project ? "The site changes from foundation to frame to finishing as work accumulates." : "When enough materials are available, the three meet and choose their next priority together."}</p>
      </div>

      <div className="blueprint-grid" aria-label={`Building plans for district ${district}`}>
        {BLUEPRINTS.map(item => {
          const BuildingIcon = BUILDING_ICONS[item.id];
          const finished = built[item.id] >= district;
          const active = blueprint.id === item.id;
          return <div key={item.id} className={`blueprint ${finished ? "finished" : active ? "current" : ""}`}>
            <div><BuildingIcon size={17}/><span>{finished ? <Check size={14}/> : active ? (project ? "Building" : "Gathering") : "Candidate"}</span></div>
            <h4>{item.name}</h4><p>{item.benefit}</p><small>{built[item.id]} built · {PROFILES[item.lead].name}</small>
          </div>;
        })}
      </div>

      <div className="district-trail" aria-label={`${district} districts reached`}>
        <div><Compass size={15}/><span>Beyond the first habitat</span></div>
        <ol>{district > 5 && <li className="older-districts">+{district - 5} established</li>}{lastDistricts.map(n => <li key={n} className={n === district ? "settling" : "established"}>{n < district ? <Check size={12}/> : <Layers3 size={12}/>}<span>{String(n).padStart(2, "0")}</span><small>{n === district ? "Settling" : "Established"}</small></li>)}</ol>
        <p>Every completed bridge reveals another visible island fragment. The settlement keeps expanding without replacing the world they already made.</p>
      </div>
    </div>
  </section>;
}
