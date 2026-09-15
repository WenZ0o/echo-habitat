"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { BLUEPRINTS, districtOf } from "@/lib/habitat/construction";
import { PROFILES, RESIDENT_IDS } from "@/lib/habitat/residents";
import type { ResidentId, World } from "@/lib/habitat/types";
import { biome, BUILDING_ORDER, buildingPosition, IslandTerrain, noise, residentPosition } from "./island-terrain";

type Camera = { x: number; y: number; zoom: number };
export function islandLocation(index: number) {
  const row = Math.floor(index / 6), slot = index % 6;
  return { x: (row % 2 ? 5 - slot : slot) * 370 + (row % 2 ? 35 : 0), y: row * 280 + (index ? (noise(index) - .5) * 26 : 0) };
}
export function zoomAt(camera: Camera, factor: number, x: number, y: number, minimum = .025): Camera {
  const zoom = Math.max(minimum, Math.min(2.2, camera.zoom * factor));
  return { x: x - (x - camera.x) * zoom / camera.zoom, y: y - (y - camera.y) * zoom / camera.zoom, zoom };
}
export function WorldAtlas({ world, selected, onSelect, onDistrict }: {
  world: World; selected: ResidentId; onSelect: (id: ResidentId) => void; onDistrict: (district: number) => void;
}) {
  const latest = districtOf(world);
  const viewport = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [camera, setCamera] = useState<Camera>({ x: 30, y: 60, zoom: .8 });
  const [following, setFollowing] = useState(true);
  const [chosen, setChosen] = useState(latest);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, {x:number;y:number}>());
  const gesture = useRef<{ x:number;y:number;distance:number } | null>(null);
  const start = useRef<{x:number;y:number;district:number|null;resident:ResidentId|null}|null>(null);
  const moved = useRef(false);
  const nodes = useMemo(() => Array.from({length:latest+1},(_,district)=>({district,...islandLocation(district)})),[latest]);
  const extent = useMemo(()=>nodes.reduce((b,n)=>({width:Math.max(b.width,n.x+320),height:Math.max(b.height,n.y+245)}),{width:320,height:245}),[nodes]);
  const minimum = Math.min(.025, (size.width-40)/extent.width, (size.height-40)/extent.height);
  const minRef = useRef(minimum); minRef.current=minimum;
  function focus(district: number) {
    const p=islandLocation(district), zoom=Math.min(1.25,(size.width-32)/360);
    setCamera({x:size.width/2-(p.x+150)*zoom,y:size.height/2-(p.y+100)*zoom,zoom});
  }
  function fit() {
    setFollowing(false);
    const zoom=Math.min(1,(size.width-40)/extent.width,(size.height-40)/extent.height);
    setCamera({x:(size.width-extent.width*zoom)/2,y:(size.height-extent.height*zoom)/2,zoom});
  }
  useEffect(()=>{
    const el=viewport.current;if(!el)return;
    const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));
    observer.observe(el);
    const wheel=(event:WheelEvent)=>{
      event.preventDefault();setFollowing(false);
      const r=el.getBoundingClientRect();
      setCamera(c=>zoomAt(c,Math.exp(-Math.max(-100,Math.min(100,event.deltaY))*.002),event.clientX-r.left,event.clientY-r.top,minRef.current));
    };
    el.addEventListener("wheel",wheel,{passive:false});
    return()=>{observer.disconnect();el.removeEventListener("wheel",wheel);};
  },[]);
  useEffect(()=>{
    if(!following)return;
    const p=islandLocation(latest),zoom=Math.min(1.1,(size.width-32)/360);
    setCamera({x:size.width/2-(p.x+150)*zoom,y:size.height/2-(p.y+100)*zoom,zoom});
  },[following,latest,size.width,size.height]);
  function measure() {
    const values=[...pointers.current.values()];
    if(!values.length)return null;
    const a=values[0],b=values[1]??a;
    return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:values.length>1?Math.hypot(a.x-b.x,a.y-b.y):0};
  }
  function down(event: PointerEvent<HTMLDivElement>) {
    if(event.pointerType==="mouse"&&event.button!==0)return;
    event.currentTarget.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.current.size===1){
      moved.current=false;
      const el=event.target as HTMLElement;
      const d=el.closest<HTMLElement>("[data-district]")?.dataset.district;
      const resident=el.closest<HTMLElement>("[data-resident]")?.dataset.resident as ResidentId|undefined;
      start.current={x:event.clientX,y:event.clientY,district:d===undefined?null:Number(d),resident:resident??null};
    } else moved.current=true;
    gesture.current=measure();setDragging(true);setFollowing(false);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if(!pointers.current.has(event.pointerId))return;
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
    const next=measure(),before=gesture.current;
    if(start.current&&Math.hypot(event.clientX-start.current.x,event.clientY-start.current.y)>6)moved.current=true;
    if(next&&before){
      const r=event.currentTarget.getBoundingClientRect();
      setCamera(c=>{
        const z=before.distance>0&&next.distance>0?zoomAt(c,next.distance/before.distance,before.x-r.left,before.y-r.top,minRef.current):c;
        return {...z,x:z.x+next.x-before.x,y:z.y+next.y-before.y};
      });
    }
    gesture.current=next;
  }
  function pick(district:number){setChosen(district);setFollowing(false);focus(district);}
  function end(event: PointerEvent<HTMLDivElement>,cancel=false) {
    if(!pointers.current.has(event.pointerId))return;
    pointers.current.delete(event.pointerId);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(!pointers.current.size){
      setDragging(false);
      if(!cancel&&!moved.current&&start.current){
        if(start.current.resident)onSelect(start.current.resident);
        else if(start.current.district!==null)pick(start.current.district);
      }
      start.current=null;
    }
    gesture.current=measure();
  }
  const visible=nodes.filter(n=>(n.x+330)*camera.zoom+camera.x>-50&&n.x*camera.zoom+camera.x<size.width+50&&(n.y+255)*camera.zoom+camera.y>-50&&n.y*camera.zoom+camera.y<size.height+50);
  return <section className="world-atlas" aria-label="Explorable world map">
    <div className="atlas-heading"><div><span className="eyebrow">A WORLD WITHOUT EDGES</span><h3>The living archipelago</h3><p>{latest} districts · Drag to explore · Scroll or pinch to zoom</p></div>
      <div className="atlas-tools">
        <button onClick={()=>{setFollowing(false);setCamera(c=>zoomAt(c,1/1.25,size.width/2,size.height/2,minimum));}} aria-label="Zoom out">−</button>
        <span>{Math.round(camera.zoom*100)}%</span>
        <button onClick={()=>{setFollowing(false);setCamera(c=>zoomAt(c,1.25,size.width/2,size.height/2,minimum));}} aria-label="Zoom in">+</button>
        <button onClick={fit}>All islands</button>
        <button onClick={()=>{setFollowing(false);pick(0);}}>Home</button>
        <button onClick={()=>{setChosen(latest);setFollowing(true);}} aria-pressed={following}>Follow work</button>
      </div>
    </div>
    <div ref={viewport} className={"atlas-viewport"+(dragging?" is-dragging":"")} tabIndex={0} role="region" aria-label="World map. Drag to pan; use arrow keys to move and plus or minus to zoom."
      onPointerDown={down} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>end(e,true)}
      onKeyDown={e=>{
        if(e.target!==e.currentTarget)return;
        const delta:Record<string,[number,number]>={ArrowLeft:[80,0],ArrowRight:[-80,0],ArrowUp:[0,80],ArrowDown:[0,-80]};
        if(delta[e.key]){e.preventDefault();setFollowing(false);const [x,y]=delta[e.key];setCamera(c=>({...c,x:c.x+x,y:c.y+y}));}
        if(e.key==="+"||e.key==="="||e.key==="-"){e.preventDefault();setFollowing(false);setCamera(c=>zoomAt(c,e.key==="-"?.8:1.25,size.width/2,size.height/2,minimum));}
      }}>
      <div className="atlas-space" style={{transform:"translate("+camera.x+"px,"+camera.y+"px) scale("+camera.zoom+")"}}>
        <svg className="atlas-connections" width={extent.width} height={extent.height} aria-hidden="true">
          {nodes.slice(1).map((n,i)=>{const a=nodes[i];return <path key={n.district} d={"M"+(a.x+150)+" "+(a.y+95)+" Q"+((a.x+n.x)/2+180)+" "+((a.y+n.y)/2+165)+" "+(n.x+150)+" "+(n.y+95)} fill="none" stroke="#9ba982" strokeWidth="2" strokeDasharray="6 8" opacity=".35"/>;})}
        </svg>
        {visible.map(n=><button key={n.district} data-district={n.district} className={"atlas-island"+(chosen===n.district?" is-selected":"")} style={{left:n.x,top:n.y}}
          aria-label={n.district===0?"The first home":"District "+n.district+", "+biome(n.district).name}
          onClick={e=>{if(e.detail===0)pick(n.district);}}>
          {n.district===0?<img src="/habitat.png" alt="" draggable={false}/>:camera.zoom > .18 ? <IslandTerrain district={n.district}/> : <svg viewBox="0 0 300 200" aria-hidden="true"><path d="M30 80L65 28 225 24 274 90 210 160 90 153Z" fill={biome(n.district).ground} stroke={biome(n.district).edge} strokeWidth="3"/></svg>}
          {n.district>0&&camera.zoom>.18&&BLUEPRINTS.map(b=>{
            const complete=world.settlement.built[b.id]>=n.district;
            const active=world.settlement.project?.district===n.district&&world.settlement.project.blueprint===b.id;
            if(!complete&&!active)return null;
            const p=buildingPosition(b.id,n.district),i=BUILDING_ORDER.indexOf(b.id);
            return <span key={b.id} className="atlas-building" style={{left:p.x+"%",top:p.y+"%",opacity:active?.5:1,"--sprite-x":i%3*50+"%","--sprite-y":Math.floor(i/3)*100+"%"} as CSSProperties}><span className="structure-sprite"/></span>;
          })}
          <span className="atlas-island-label" style={{ display: camera.zoom < .18 ? "none" : undefined }}>{n.district===0?"The first home":"District "+n.district}<small>{n.district===0?"Where it began":biome(n.district).name+" · "+BLUEPRINTS.filter(b=>world.settlement.built[b.id]>=n.district).length+"/6"}</small></span>
        </button>)}
        {world.residents.map(resident=>{
          const p=islandLocation(resident.district),local=residentPosition(resident.position,resident.district);
          return <button key={resident.id} data-resident={resident.id} className={"atlas-resident"+(selected===resident.id?" is-selected":"")} aria-label={"Observe "+PROFILES[resident.id].name+": "+resident.activity}
            onClick={e=>{if(e.detail===0)onSelect(resident.id);}}
            style={{left:p.x+local.x*3,top:p.y+local.y*2,"--robot-x":RESIDENT_IDS.indexOf(resident.id)*50+"%","--resident":PROFILES[resident.id].color} as CSSProperties}>
            <span className="robot-sprite"/><span className="robot-label">{PROFILES[resident.id].name}</span>
          </button>;
        })}
      </div>
      <span className="atlas-compass" aria-hidden="true">N ↑</span>
    </div>
    <div className="atlas-footer"><span>{chosen===0?"The first home":"District "+chosen+" · "+biome(chosen).name}</span>
      {chosen>0&&<button onClick={()=>onDistrict(chosen)}>Open district details ↑</button>}
      <span className="atlas-scroll-note">Scroll the page outside the map.</span>
    </div>
  </section>;
}
