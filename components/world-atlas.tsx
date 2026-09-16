"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BLUEPRINTS, districtOf, workRequired } from "@/lib/habitat/construction";
import { PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { ResidentId, World } from "@/lib/habitat/types";
import { biome, BUILDING_ORDER, buildingPosition, IslandTerrain, islandOutlinePoints, noise, residentPosition } from "./island-terrain";

type Camera = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };

const CLUSTER_OFFSETS: Point[] = [
  { x: 0, y: 0 },
  { x: 335, y: -118 },
  { x: 650, y: 18 },
  { x: 455, y: 275 },
  { x: 80, y: 255 },
];

export function islandLocation(index: number) {
  if (index === 0) return { x: 90, y: 300 };
  const cluster = Math.floor((index - 1) / CLUSTER_OFFSETS.length);
  const slot = (index - 1) % CLUSTER_OFFSETS.length;
  const offset = CLUSTER_OFFSETS[slot];
  const centerX = 455 + cluster * 960;
  const centerY = 300 + (cluster % 2 ? 105 : 0);
  return {
    x: centerX + offset.x + (noise(index * 17) - .5) * 46,
    y: centerY + offset.y + (noise(index * 29) - .5) * 38,
  };
}

export function zoomAt(camera: Camera, factor: number, x: number, y: number, minimum = .035): Camera {
  const zoom = Math.max(minimum, Math.min(2.2, camera.zoom * factor));
  return { x: x - (x - camera.x) * zoom / camera.zoom, y: y - (y - camera.y) * zoom / camera.zoom, zoom };
}

export function WorldAtlas({ world, selected, onSelect, onDistrict }: {
  world: World;
  selected: ResidentId;
  onSelect: (id: ResidentId) => void;
  onDistrict: (district: number) => void;
}) {
  const latest = districtOf(world);
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 590 });
  const [camera, setCamera] = useState<Camera>({ x: 40, y: 70, zoom: .82 });
  const [following, setFollowing] = useState(true);
  const [chosen, setChosen] = useState(latest);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ x: number; y: number; distance: number } | null>(null);
  const start = useRef<{ x: number; y: number; district: number | null; resident: ResidentId | null } | null>(null);
  const moved = useRef(false);

  const nodes = useMemo(() => Array.from({ length: latest + 1 }, (_, district) => ({ district, ...islandLocation(district) })), [latest]);
  const extent = useMemo(() => nodes.reduce((box, node) => ({
    width: Math.max(box.width, node.x + 345),
    height: Math.max(box.height, node.y + 265),
  }), { width: 420, height: 620 }), [nodes]);
  const minimum = Math.max(.035, Math.min(.34, (size.width - 44) / extent.width, (size.height - 44) / extent.height));
  const minRef = useRef(minimum);
  minRef.current = minimum;

  const selectedBiome = chosen > 0 ? biome(chosen) : null;
  const selectedCompleted = chosen > 0 ? BLUEPRINTS.filter(item => world.settlement.built[item.id] >= chosen).length : 0;
  const selectedResidents = world.residents.filter(resident => resident.district === chosen);
  const selectedProject = chosen > 0 && world.settlement.project?.district === chosen ? world.settlement.project : null;
  const selectedProjectBlueprint = selectedProject ? BLUEPRINTS.find(item => item.id === selectedProject.blueprint) : null;
  const fractionalProgress = selectedProject && selectedProjectBlueprint
    ? Math.min(1, selectedProject.work / workRequired(selectedProjectBlueprint, chosen)) / BLUEPRINTS.length
    : 0;
  const districtProgress = chosen > 0 ? Math.min(100, Math.round((selectedCompleted / BLUEPRINTS.length + fractionalProgress) * 100)) : 100;
  const detailLevel = camera.zoom < .19 ? "far" : camera.zoom < .42 ? "medium" : "near";

  function focus(district: number) {
    const point = islandLocation(district);
    const zoom = Math.min(1.18, Math.max(.72, (size.width - 36) / 430));
    setCamera({ x: size.width / 2 - (point.x + 150) * zoom, y: size.height / 2 - (point.y + 100) * zoom, zoom });
  }

  function fit() {
    setFollowing(false);
    const zoom = Math.min(.92, (size.width - 46) / extent.width, (size.height - 46) / extent.height);
    setCamera({ x: (size.width - extent.width * zoom) / 2, y: (size.height - extent.height * zoom) / 2, zoom });
  }

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setFollowing(false);
      const bounds = element.getBoundingClientRect();
      setCamera(current => zoomAt(current, Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .002), event.clientX - bounds.left, event.clientY - bounds.top, minRef.current));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", wheel);
    };
  }, []);

  useEffect(() => {
    if (!following) return;
    setChosen(latest);
    const point = islandLocation(latest);
    const zoom = Math.min(1.06, Math.max(.7, (size.width - 36) / 430));
    setCamera({ x: size.width / 2 - (point.x + 150) * zoom, y: size.height / 2 - (point.y + 100) * zoom, zoom });
  }, [following, latest, size.width, size.height]);

  function measure() {
    const values = [...pointers.current.values()];
    if (!values.length) return null;
    const a = values[0], b = values[1] ?? a;
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: values.length > 1 ? Math.hypot(a.x - b.x, a.y - b.y) : 0 };
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      moved.current = false;
      const element = event.target as HTMLElement;
      const district = element.closest<HTMLElement>("[data-district]")?.dataset.district;
      const resident = element.closest<HTMLElement>("[data-resident]")?.dataset.resident as ResidentId | undefined;
      start.current = { x: event.clientX, y: event.clientY, district: district === undefined ? null : Number(district), resident: resident ?? null };
    } else moved.current = true;
    gesture.current = measure();
    setDragging(true);
    setFollowing(false);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const next = measure(), before = gesture.current;
    if (start.current && Math.hypot(event.clientX - start.current.x, event.clientY - start.current.y) > 6) moved.current = true;
    if (next && before) {
      const bounds = event.currentTarget.getBoundingClientRect();
      setCamera(current => {
        const zoomed = before.distance > 0 && next.distance > 0
          ? zoomAt(current, next.distance / before.distance, before.x - bounds.left, before.y - bounds.top, minRef.current)
          : current;
        return { ...zoomed, x: zoomed.x + next.x - before.x, y: zoomed.y + next.y - before.y };
      });
    }
    gesture.current = next;
  }

  function pick(district: number) {
    setChosen(district);
    setFollowing(false);
    focus(district);
  }

  function end(event: PointerEvent<HTMLDivElement>, cancel = false) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) {
      setDragging(false);
      if (!cancel && !moved.current && start.current) {
        if (start.current.resident) onSelect(start.current.resident);
        else if (start.current.district !== null) pick(start.current.district);
      }
      start.current = null;
    }
    gesture.current = measure();
  }

  const visible = nodes.filter(node =>
    (node.x + 345) * camera.zoom + camera.x > -70 && node.x * camera.zoom + camera.x < size.width + 70 &&
    (node.y + 265) * camera.zoom + camera.y > -70 && node.y * camera.zoom + camera.y < size.height + 70);
  const visibleDistricts = new Set(visible.map(node => node.district));

  return <section className={`world-atlas atlas-${detailLevel}`} aria-label="The Living Archipelago, an explorable world map">
    <div className="atlas-heading">
      <div className="atlas-title-block">
        <span className="eyebrow">THE LIVING ARCHIPELAGO</span>
        <h3>A world growing island by island.</h3>
        <p>{latest} {latest === 1 ? "district" : "districts"} beyond Origin · drag to explore · scroll or pinch to zoom</p>
      </div>
      <div className="atlas-tools" aria-label="Atlas controls">
        <button onClick={() => { setFollowing(false); setCamera(current => zoomAt(current, 1 / 1.25, size.width / 2, size.height / 2, minimum)); }} aria-label="Zoom out">−</button>
        <span>{Math.round(camera.zoom * 100)}%</span>
        <button onClick={() => { setFollowing(false); setCamera(current => zoomAt(current, 1.25, size.width / 2, size.height / 2, minimum)); }} aria-label="Zoom in">+</button>
        <button onClick={fit}>Fit world</button>
        <button onClick={() => pick(0)}>Origin</button>
        <button className="atlas-follow" onClick={() => { setChosen(latest); setFollowing(true); }} aria-pressed={following}>Follow life</button>
      </div>
    </div>

    <div ref={viewport} className={`atlas-viewport${dragging ? " is-dragging" : ""}`} tabIndex={0} role="region" aria-label="World map. Drag to pan; use arrow keys to move and plus or minus to zoom."
      onPointerDown={down} onPointerMove={move} onPointerUp={event => end(event)} onPointerCancel={event => end(event, true)} onLostPointerCapture={event => end(event, true)}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const delta: Record<string, [number, number]> = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] };
        if (delta[event.key]) {
          event.preventDefault();
          setFollowing(false);
          const [x, y] = delta[event.key];
          setCamera(current => ({ ...current, x: current.x + x, y: current.y + y }));
        }
        if (event.key === "+" || event.key === "=" || event.key === "-") {
          event.preventDefault();
          setFollowing(false);
          setCamera(current => zoomAt(current, event.key === "-" ? .8 : 1.25, size.width / 2, size.height / 2, minimum));
        }
      }}>
      <div className="atlas-ocean-depth" aria-hidden="true"/>
      <div className="atlas-haze atlas-haze-one" aria-hidden="true"/>
      <div className="atlas-haze atlas-haze-two" aria-hidden="true"/>

      <div className={`atlas-space${chosen !== null ? " has-selection" : ""}`} style={{ transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})` }}>
        <svg className="atlas-connections" width={extent.width} height={extent.height} aria-hidden="true">
          <defs>
            <linearGradient id="atlas-route" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#70988b" stopOpacity=".08"/><stop offset=".5" stopColor="#c4d39f" stopOpacity=".5"/><stop offset="1" stopColor="#70988b" stopOpacity=".08"/></linearGradient>
          </defs>
          {nodes.slice(1).map((node, index) => {
            const previous = nodes[index];
            const controlX = (previous.x + node.x) / 2 + 150;
            const controlY = (previous.y + node.y) / 2 + (index % 2 ? -72 : 92);
            const path = `M${previous.x + 150} ${previous.y + 96} Q${controlX} ${controlY} ${node.x + 150} ${node.y + 96}`;
            return <g key={node.district}><path className="atlas-route-shadow" d={path}/><path className="atlas-route" d={path}/></g>;
          })}
        </svg>

        {visible.map(node => {
          const islandBiome = node.district ? biome(node.district) : null;
          const complete = node.district ? BLUEPRINTS.filter(item => world.settlement.built[item.id] >= node.district).length : 0;
          const isChosen = chosen === node.district;
          return <button key={node.district} data-district={node.district} className={`atlas-island${isChosen ? " is-selected" : ""}${node.district === latest ? " is-frontier" : ""}`} style={{ left: node.x, top: node.y, "--island-accent": islandBiome?.accent ?? "#d5dda9" } as CSSProperties}
            aria-label={node.district === 0 ? "Origin, the first home" : `District ${node.district}, ${islandBiome?.name}. Landmark: ${islandBiome?.landmark}.`}
            onClick={event => { if (event.detail === 0) pick(node.district); }}>
            <span className="atlas-island-halo" aria-hidden="true"/>
            {node.district === 0
              ? <img className="atlas-home-art" src="/habitat.png" alt="" draggable={false}/>
              : detailLevel === "far"
                ? <svg className="atlas-silhouette" viewBox="0 0 300 200" aria-hidden="true"><polygon points={islandOutlinePoints(node.district).map(point => `${point.x},${point.y}`).join(" ")} fill={islandBiome?.ground} stroke={islandBiome?.edge} strokeWidth="3"/><circle cx="150" cy="74" r="8" fill={islandBiome?.accent} opacity=".8"/></svg>
                : <IslandTerrain district={node.district}/>}

            {node.district > 0 && detailLevel !== "far" && BLUEPRINTS.map(blueprint => {
              const built = world.settlement.built[blueprint.id] >= node.district;
              const active = world.settlement.project?.district === node.district && world.settlement.project.blueprint === blueprint.id;
              if (!built && !active) return null;
              const position = buildingPosition(blueprint.id, node.district), index = BUILDING_ORDER.indexOf(blueprint.id);
              return <span key={blueprint.id} className={`atlas-building${active ? " is-building" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, opacity: active ? .58 : 1, "--sprite-x": `${index % 3 * 50}%`, "--sprite-y": `${Math.floor(index / 3) * 100}%` } as CSSProperties}><span className="structure-sprite"/></span>;
            })}

            <span className="atlas-island-label">
              <b>{node.district === 0 ? "ORIGIN" : String(node.district).padStart(2, "0")}</b>
              {(isChosen || detailLevel === "near") && <span>{node.district === 0 ? "The first home" : islandBiome?.shortName}</span>}
              {isChosen && node.district > 0 && <small>{complete}/6 structures</small>}
            </span>
          </button>;
        })}

        {detailLevel === "near" && world.residents.filter(resident => visibleDistricts.has(resident.district)).map(resident => {
          const island = islandLocation(resident.district), local = residentPosition(resident.position, resident.district);
          return <button key={resident.id} data-resident={resident.id} className={`atlas-resident${selected === resident.id ? " is-selected" : ""}`} aria-label={`Observe ${PROFILES[resident.id].name}: ${resident.activity}`}
            onClick={event => { if (event.detail === 0) onSelect(resident.id); }}
            style={{ left: island.x + local.x * 3, top: island.y + local.y * 2, "--robot-x": `${RESIDENT_IDS.indexOf(resident.id) * 50}%`, "--resident": PROFILES[resident.id].color } as CSSProperties}>
            <span className="robot-sprite"/><span className="robot-label">{PROFILES[resident.id].name}</span>
          </button>;
        })}
      </div>

      <span className="atlas-compass" aria-hidden="true"><i>N</i><b>↑</b></span>
      <div className="atlas-focus-card" onPointerDown={event => event.stopPropagation()}>
        {chosen === 0 ? <>
          <span className="atlas-card-eyebrow">ORIGIN / WHERE IT BEGAN</span>
          <h4>The First Home</h4>
          <p>The grove, reflection pool and observatory at the center of every journey outward.</p>
          <div className="atlas-card-meta"><span><b>3</b> residents</span><span><b>001</b> experiment</span></div>
        </> : <>
          <div className="atlas-card-top"><span className="atlas-card-eyebrow">DISTRICT {String(chosen).padStart(2, "0")}</span>{chosen === latest && <span className="atlas-frontier-badge">FRONTIER</span>}</div>
          <h4>{selectedBiome?.name}</h4>
          <p>{selectedBiome?.mood}</p>
          <div className="atlas-landmark"><span>LANDMARK</span><strong>{selectedBiome?.landmark}</strong></div>
          <div className="atlas-progress-row"><span>Settlement</span><b>{districtProgress}%</b></div>
          <div className="atlas-progress" aria-label={`District settlement ${districtProgress}% complete`}><i style={{ width: `${districtProgress}%` }}/></div>
          <div className="atlas-card-meta"><span><b>{selectedCompleted}/6</b> structures</span><span><b>{selectedResidents.length}</b> present</span></div>
          <button className="atlas-enter" onClick={() => onDistrict(chosen)}>Enter district <span>↗</span></button>
        </>}
      </div>
    </div>

    <div className="atlas-footer">
      <span><i className="atlas-live-dot"/>World state live</span>
      <span>{detailLevel === "far" ? "Silhouette view" : detailLevel === "medium" ? "Terrain view" : "Life view"}</span>
      <span className="atlas-scroll-note">Drag the atlas · scroll outside it to move the page</span>
    </div>
  </section>;
}
