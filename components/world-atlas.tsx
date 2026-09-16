"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BLUEPRINTS, districtOf, workRequired } from "@/lib/habitat/construction";
import { PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { ResidentId, World } from "@/lib/habitat/types";
import { biome, buildingPosition, noise, residentPosition } from "./island-terrain";
import { districtArchitecture, districtStructure } from "./district-architecture";
import { DistrictRasterIsland, DistrictRasterStructure, districtCityPlan } from "./district-raster";

type Camera = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };
type RingMeta = { ring: number; slot: number; count: number };

function ringCapacity(ring: number) {
  return ring <= 0 ? 1 : 6 + (ring - 1) * 4;
}

function ringMeta(index: number): RingMeta {
  if (index <= 0) return { ring: 0, slot: 0, count: 1 };
  let remaining = index;
  let ring = 1;
  while (remaining > ringCapacity(ring)) {
    remaining -= ringCapacity(ring);
    ring += 1;
  }
  return { ring, slot: remaining - 1, count: ringCapacity(ring) };
}

function ringRadii(ring: number) {
  return {
    x: 380 + Math.max(0, ring - 1) * 340,
    y: 250 + Math.max(0, ring - 1) * 230,
  };
}

function ringStart(ring: number) {
  let start = 1;
  for (let current = 1; current < ring; current += 1) start += ringCapacity(current);
  return start;
}

export function islandLocation(index: number) {
  if (index === 0) return { x: 0, y: 0 };
  const meta = ringMeta(index);
  const radii = ringRadii(meta.ring);
  const step = Math.PI * 2 / meta.count;
  const stagger = meta.ring % 2 === 0 ? step / 2 : 0;
  const angle = -Math.PI / 2 + meta.slot * step + stagger + (noise(index * 29) - .5) * .1;
  const radiusX = radii.x + (noise(index * 17) - .5) * 42;
  const radiusY = radii.y + (noise(index * 41) - .5) * 30;
  return { x: Math.cos(angle) * radiusX, y: Math.sin(angle) * radiusY };
}

function districtParent(index: number) {
  const meta = ringMeta(index);
  if (meta.ring <= 1) return 0;
  const current = islandLocation(index);
  const innerRing = meta.ring - 1;
  const start = ringStart(innerRing);
  const count = ringCapacity(innerRing);
  let best = start;
  let distance = Number.POSITIVE_INFINITY;
  for (let offset = 0; offset < count; offset += 1) {
    const candidate = start + offset;
    const point = islandLocation(candidate);
    const next = Math.hypot(point.x - current.x, point.y - current.y);
    if (next < distance) {
      distance = next;
      best = candidate;
    }
  }
  return best;
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
  const [camera, setCamera] = useState<Camera>({ x: 292, y: 223, zoom: .72 });
  const [following, setFollowing] = useState(false);
  const [chosen, setChosen] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ x: number; y: number; distance: number } | null>(null);
  const start = useRef<{ x: number; y: number; district: number | null; resident: ResidentId | null } | null>(null);
  const moved = useRef(false);

  const nodes = useMemo(() => Array.from({ length: latest + 1 }, (_, district) => ({ district, ...islandLocation(district) })), [latest]);
  const extent = useMemo(() => {
    const raw = nodes.reduce((box, node) => ({
      minX: Math.min(box.minX, node.x),
      minY: Math.min(box.minY, node.y),
      maxX: Math.max(box.maxX, node.x + 300),
      maxY: Math.max(box.maxY, node.y + 210),
    }), { minX: 0, minY: 0, maxX: 300, maxY: 210 });
    const padding = 120;
    return {
      minX: raw.minX - padding,
      minY: raw.minY - padding,
      maxX: raw.maxX + padding,
      maxY: raw.maxY + padding,
      width: raw.maxX - raw.minX + padding * 2,
      height: raw.maxY - raw.minY + padding * 2,
    };
  }, [nodes]);
  const minimum = Math.max(.035, Math.min(.34, (size.width - 44) / extent.width, (size.height - 44) / extent.height));
  const minRef = useRef(minimum);
  minRef.current = minimum;
  const maxRing = ringMeta(latest).ring;

  const selectedBiome = chosen > 0 ? biome(chosen) : null;
  const selectedArchitecture = chosen > 0 ? districtArchitecture(chosen) : null;
  const selectedCityPlan = chosen > 0 ? districtCityPlan(chosen) : null;
  const selectedCompleted = chosen > 0 ? BLUEPRINTS.filter(item => world.settlement.built[item.id] >= chosen).length : 0;
  const selectedResidents = world.residents.filter(resident => resident.district === chosen);
  const selectedProject = chosen > 0 && world.settlement.project?.district === chosen ? world.settlement.project : null;
  const selectedProjectBlueprint = selectedProject ? BLUEPRINTS.find(item => item.id === selectedProject.blueprint) : null;
  const selectedProjectIdentity = selectedProject ? districtStructure(selectedProject.blueprint, chosen) : null;
  const fractionalProgress = selectedProject && selectedProjectBlueprint
    ? Math.min(1, selectedProject.work / workRequired(selectedProjectBlueprint, chosen)) / BLUEPRINTS.length
    : 0;
  const districtProgress = chosen > 0 ? Math.min(100, Math.round((selectedCompleted / BLUEPRINTS.length + fractionalProgress) * 100)) : 100;
  const detailLevel = camera.zoom < .19 ? "far" : camera.zoom < .42 ? "medium" : "near";

  function focus(district: number) {
    const point = islandLocation(district);
    const zoom = district === 0 ? Math.min(.88, Math.max(.62, (size.width - 36) / 1080)) : Math.min(1.18, Math.max(.72, (size.width - 36) / 430));
    setCamera({ x: size.width / 2 - (point.x + 150) * zoom, y: size.height / 2 - (point.y + 100) * zoom, zoom });
  }

  function fit() {
    setFollowing(false);
    const zoom = Math.min(.92, (size.width - 56) / extent.width, (size.height - 56) / extent.height);
    setCamera({
      x: (size.width - extent.width * zoom) / 2 - extent.minX * zoom,
      y: (size.height - extent.height * zoom) / 2 - extent.minY * zoom,
      zoom,
    });
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
    if (following) return;
    if (chosen !== 0) return;
    const zoom = Math.min(.78, Math.max(.5, (size.width - 36) / 1040));
    setCamera({ x: size.width / 2 - 150 * zoom, y: size.height / 2 - 100 * zoom, zoom });
  }, [chosen, following, size.width, size.height]);

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
    (node.x + 345) * camera.zoom + camera.x > -90 && node.x * camera.zoom + camera.x < size.width + 90 &&
    (node.y + 265) * camera.zoom + camera.y > -90 && node.y * camera.zoom + camera.y < size.height + 90);
  const visibleDistricts = new Set(visible.map(node => node.district));

  return <section className={`world-atlas atlas-${detailLevel}`} aria-label="The Living Archipelago, an explorable world map">
    <div className="atlas-heading">
      <div className="atlas-title-block">
        <span className="eyebrow">THE LIVING ARCHIPELAGO</span>
        <h3>Origin at the heart of a world growing outward.</h3>
        <p>{latest} {latest === 1 ? "district" : "districts"} around Origin · new cities form in expanding world rings</p>
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
        <svg className="atlas-connections" width={extent.width} height={extent.height} viewBox={`${extent.minX} ${extent.minY} ${extent.width} ${extent.height}`} style={{ left: extent.minX, top: extent.minY }} aria-hidden="true">
          {Array.from({ length: maxRing }, (_, index) => index + 1).map(ring => {
            const radii = ringRadii(ring);
            return <ellipse key={`ring-${ring}`} className="atlas-orbit-ring" cx="150" cy="96" rx={radii.x} ry={radii.y}/>;
          })}
          {nodes.slice(1).map(node => {
            const parentDistrict = districtParent(node.district);
            const parent = nodes.find(item => item.district === parentDistrict) ?? nodes[0];
            const startX = parent.x + 150, startY = parent.y + 96;
            const endX = node.x + 150, endY = node.y + 96;
            const dx = endX - startX, dy = endY - startY;
            const length = Math.max(1, Math.hypot(dx, dy));
            const bend = (node.district % 2 ? 1 : -1) * Math.min(70, length * .11);
            const controlX = (startX + endX) / 2 - dy / length * bend;
            const controlY = (startY + endY) / 2 + dx / length * bend;
            const path = `M${startX} ${startY} Q${controlX} ${controlY} ${endX} ${endY}`;
            return <g key={node.district}>
              <path className="atlas-route-shadow" d={path}/>
              <path className={`atlas-route${parentDistrict === 0 ? " is-primary" : ""}`} d={path}/>
              <circle className="atlas-route-node" cx={endX} cy={endY} r="2.5"/>
            </g>;
          })}
        </svg>

        {visible.map(node => {
          const islandBiome = node.district ? biome(node.district) : null;
          const islandArchitecture = node.district ? districtArchitecture(node.district) : null;
          const cityPlan = node.district ? districtCityPlan(node.district) : null;
          const complete = node.district ? BLUEPRINTS.filter(item => world.settlement.built[item.id] >= node.district).length : 0;
          const isChosen = chosen === node.district;
          return <button key={node.district} data-district={node.district} className={`atlas-island${isChosen ? " is-selected" : ""}${node.district === latest ? " is-frontier" : ""}`} style={{ left: node.x, top: node.y, "--island-accent": islandBiome?.accent ?? "#d5dda9" } as CSSProperties}
            aria-label={node.district === 0 ? "Origin, the first home" : `District ${node.district}, ${islandBiome?.name}. ${islandArchitecture?.title}. Landmark: ${islandBiome?.landmark}.`}
            onClick={event => { if (event.detail === 0) pick(node.district); }}>
            <span className="atlas-island-halo" aria-hidden="true"/>
            {node.district === 0
              ? <><span className="atlas-origin-core" aria-hidden="true"/><img className="atlas-home-art" src="/habitat.png" alt="" draggable={false}/></>
              : <DistrictRasterIsland district={node.district} completed={complete} power={world.power} compact={detailLevel !== "near"}/>} 

            {node.district > 0 && detailLevel !== "far" && BLUEPRINTS.map(blueprint => {
              const built = world.settlement.built[blueprint.id] >= node.district;
              const active = world.settlement.project?.district === node.district && world.settlement.project.blueprint === blueprint.id;
              if (!built && !active) return null;
              const position = buildingPosition(blueprint.id, node.district);
              const activeProgress = active ? Math.floor(100 * (world.settlement.project?.work ?? 0) / workRequired(blueprint, node.district)) : 100;
              return <span key={blueprint.id} className={`atlas-building${active ? " is-building" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%`, opacity: active ? .78 : 1 } as CSSProperties}>
                <DistrictRasterStructure id={blueprint.id} district={node.district} progress={activeProgress}/>
              </span>;
            })}

            {node.district > 0 && <span className="atlas-landmark-marker" title={islandBiome?.landmark} aria-hidden="true">{cityPlan?.mark}</span>}
            <span className="atlas-island-label">
              <b>{node.district === 0 ? "ORIGIN" : String(node.district).padStart(2, "0")}</b>
              {(isChosen || detailLevel === "near") && <span>{node.district === 0 ? "The first home" : cityPlan?.label}</span>}
              {isChosen && node.district > 0 && <small>{complete}/6</small>}
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
          <span className="atlas-card-eyebrow">ORIGIN / WORLD CENTER</span>
          <h4>The First Home</h4>
          <p>The grove, reflection pool and observatory at the center of every journey outward.</p>
          <div className="atlas-card-meta"><span><b>3</b> residents</span><span><b>{maxRing}</b> world rings</span></div>
        </> : <>
          <div className="atlas-card-top"><span className="atlas-card-eyebrow">DISTRICT {String(chosen).padStart(2, "0")}</span>{chosen === latest && <span className="atlas-frontier-badge">FRONTIER</span>}</div>
          <h4>{selectedArchitecture?.title}</h4>
          <p>{selectedBiome?.mood}</p>
          <div className="atlas-landmark"><span>LANDMARK</span><strong>{selectedBiome?.landmark}</strong></div>
          <div className="atlas-settlement-identity"><span>CITY FORM</span><strong>{selectedCityPlan?.label}</strong><small>{selectedArchitecture?.style}</small></div>
          {selectedProjectIdentity && <div className="atlas-current-build"><span>TAKING SHAPE</span><strong>{selectedProjectIdentity.name}</strong></div>}
          <div className="atlas-progress-row"><span>Settlement</span><b>{districtProgress}%</b></div>
          <div className="atlas-progress" aria-label={`District settlement ${districtProgress}% complete`}><i style={{ width: `${districtProgress}%` }}/></div>
          <div className="atlas-card-meta"><span><b>{selectedCompleted}/6</b> structures</span><span><b>{selectedResidents.length}</b> present</span></div>
          <button className="atlas-enter" onClick={() => onDistrict(chosen)}>Enter district <span>↗</span></button>
        </>}
      </div>
    </div>

    <div className="atlas-footer">
      <span><i className="atlas-live-dot"/>World state live</span>
      <span>{detailLevel === "far" ? "World rings" : detailLevel === "medium" ? "City view" : "Life view"}</span>
      <span className="atlas-scroll-note">Drag the atlas · scroll outside it to move the page</span>
    </div>
  </section>;
}
