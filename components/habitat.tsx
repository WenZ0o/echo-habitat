"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, BatteryMedium, BookOpen, Check, ChevronRight, CircleHelp, CloudRain, Compass, Eye, Flower2, Heart, Leaf, MapPin, Orbit, Pause, Play, Radio, RotateCcw, SkipForward, Sparkles, Sprout, Sun, Zap, ZapOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createWorld } from "@/lib/habitat/engine";
import { BuildingMarkers, ConstructionBoard, habitatStage } from "@/components/construction-board";
import { districtOf } from "@/lib/habitat/construction";
import { EVENT_LABELS, PLACES, PROFILES, RESIDENT_IDS, moodLabel, worldTime } from "@/lib/habitat/residents";
import type { ChronicleEntry, Intervention, Resident, ResidentId, WorldAction, WorldResponse } from "@/lib/habitat/types";

function Glyph({ id, size = 20 }: { id: ResidentId; size?: number }) {
  const Icon = id === "moss" ? Sprout : id === "lux" ? Sun : Sparkles;
  return <Icon size={size} strokeWidth={1.4} aria-hidden="true" />;
}
function Avatar({ id, large = false }: { id: ResidentId; large?: boolean }) {
  return <span className={`avatar ${large ? "avatar-large" : ""}`} style={{ "--resident": PROFILES[id].color } as CSSProperties}><Glyph id={id} size={large ? 29 : 20} /></span>;
}
function Entry({ entry, compact = false }: { entry: ChronicleEntry; compact?: boolean }) {
  const time = worldTime(entry.tick);
  const profile = entry.actor === "world" ? null : PROFILES[entry.actor];
  return <article className={`log-entry ${compact ? "compact" : ""}`}>
    <span className="log-symbol" style={{ color: profile?.color ?? "#b7c4b6" }}>{entry.actor === "world" ? <Orbit size={17} /> : <Glyph id={entry.actor} size={17} />}</span>
    <div className="log-copy"><div className="log-meta"><span>{profile?.name ?? "Habitat"}</span><time>Day {time.day} · {time.time}</time></div><h3>{entry.title}</h3>{!compact && <p>{entry.text}</p>}</div>
  </article>;
}
function ResidentCard({ resident, selected, onSelect }: { resident: Resident; selected: boolean; onSelect: () => void }) {
  const profile = PROFILES[resident.id];
  return <button className={`resident-card ${selected ? "selected" : ""}`} onClick={onSelect} aria-pressed={selected} style={{ "--resident": profile.color } as CSSProperties}>
    <div className="resident-card-top"><Avatar id={resident.id} /><div><strong>{profile.name}</strong><span>{profile.role}</span></div><ArrowUpRight size={16} /></div>
    <p>{resident.activity}</p>
    <div className="resident-card-bottom"><span><span className="mood-dot" />{moodLabel(resident.mood)}</span><span><BookOpen size={13} />{resident.memories.length}</span></div>
  </button>;
}

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown | Promise<unknown> };
type ModelContext = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };

export default function Habitat() {
  const [data, setData] = useState<WorldResponse>(() => ({ world: createWorld(), revision: 0 }));
  const [selected, setSelected] = useState<ResidentId>("moss");
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(true), [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data), loadedRef = useRef(false), lock = useRef(false);
  const accept = useCallback((next: WorldResponse) => { dataRef.current = next; setData(next); }, []);

  const load = useCallback(async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/habitat", { cache: "no-store" });
      const body = await res.json() as WorldResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "The habitat could not be loaded.");
      if (!body.world || !Number.isInteger(body.revision)) throw new Error("The habitat returned an incomplete state. Please reconnect.");
      accept(body); setLoaded(true); loadedRef.current = true;
    } catch (e) { setError(e instanceof Error ? e.message : "Connection interrupted. Please try again."); setPlaying(false); }
    finally { setBusy(false); }
  }, [accept]);

  const act = useCallback(async (action: WorldAction): Promise<WorldResponse> => {
    if (!loadedRef.current) throw new Error("Wait for the habitat to load.");
    if (lock.current) throw new Error("A habitat action is already in progress.");
    lock.current = true; setBusy(true); setError(null);
    try {
      const res = await fetch("/api/habitat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: dataRef.current.revision, action }) });
      const body = await res.json() as WorldResponse & { error?: string };
      if (res.status === 409 && body.world) {
        accept(body); throw new Error("The habitat changed in another tab. The latest state is now loaded; you can continue.");
      }
      if (!res.ok) throw new Error(body.error ?? "Your change could not be saved.");
      if (!body.world || !Number.isInteger(body.revision)) throw new Error("Your change could not be confirmed. Please reconnect.");
      accept(body);
      return body;
    } catch (e) { setError(e instanceof Error ? e.message : "Connection interrupted. Please try again."); setPlaying(false); throw e; }
    finally { lock.current = false; setBusy(false); }
  }, [accept]);
  const invoke = (action: WorldAction) => { void act(action).catch(() => {}); };
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loaded || !playing) return;
    const interval = setInterval(() => { if (!document.hidden && !lock.current) void act({ type: "step" }).catch(() => {}); }, 6500 / speed);
    return () => clearInterval(interval);
  }, [loaded, playing, speed, act]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(e => console.warn("Habitat tool unavailable", e)); } catch (e) { console.warn("Habitat tool unavailable", e); } };
    register({ name: "read_habitat", title: "Read the habitat", description: "Read current world conditions, residents, memories and relationships without changing the habitat.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
      execute(input) { if (!input || typeof input !== "object" || Object.keys(input).length) throw new Error("Expected an empty object."); if (!loadedRef.current) throw new Error("Habitat is still loading."); return dataRef.current; } });
    register({ name: "introduce_habitat_event", title: "Introduce a habitat event", description: "Introduce rain, a relic or a blackout, advance the habitat one turn, and save the resulting state. Fails while another event is active.",
      inputSchema: { type: "object", properties: { event: { type: "string", enum: ["rain", "relic", "blackout"] } }, required: ["event"], additionalProperties: false }, annotations: { readOnlyHint: false },
      async execute(input) {
        if (!input || typeof input !== "object" || Object.keys(input).length !== 1 || !["rain", "relic", "blackout"].includes(String((input as {event: string}).event))) throw new Error("Choose rain, relic or blackout.");
        const next = await act({ type: "event", event: (input as { event: Intervention }).event });
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        return { tick: next.world.tick, intervention: next.world.intervention, memories: next.world.totalMemories };
      } });
    return () => lifecycle.abort();
  }, [act]);

  const world = data.world, clock = worldTime(world.tick), stage = habitatStage(world);
  const art = ["/habitat.png", "/habitat-growing.png", "/habitat-expanded.png"][stage];
  const resident = world.residents.find(r => r.id === selected)!;
  const profile = PROFILES[selected];
  const remaining = world.intervention?.remaining ?? 0;
  const status = !loaded ? "Connecting" : busy ? "Saving" : "All changes saved";
  return <Tabs defaultValue="observe" className="habitat-app">
    <header className="topbar">
      <a className="brand" href="/" aria-label="Echo Habitat home"><img src="/favicon.svg" width="37" height="37" alt="" /><span>ECHO<span className="brand-light">HABITAT</span></span><span className="version">02</span></a>
      <TabsList variant="line" className="main-nav" aria-label="Main navigation"><TabsTrigger value="observe"><Eye size={16} />Observe</TabsTrigger><TabsTrigger value="chronicle"><BookOpen size={16} />Chronicle<span className="nav-count">{world.chronicle.length}</span></TabsTrigger></TabsList>
      <div className="header-right"><span className="simulation-label">Life simulation</span>
        <Dialog onOpenChange={open => { if (open) setPlaying(false); }}><DialogTrigger asChild><button className="icon-button" aria-label="About this habitat"><CircleHelp size={19} /></button></DialogTrigger><DialogContent className="about-dialog"><DialogHeader><DialogTitle>A small world, unfolding.</DialogTitle><DialogDescription>ECHO HABITAT is an interactive life simulation. Three residents make decisions from their needs, roles, shared memories and surroundings.</DialogDescription></DialogHeader><div className="about-body"><p>Select a resident to see their thoughts and memories. Introduce an event and watch the habitat respond. Each step moves the world forward by ten simulated minutes.</p><p>This version uses a rule-driven simulation with authored dialogue, not a connected language model. It advances while this page is visible and running. Closing the page pauses this client; another open tab can still advance the same habitat.</p><p>Moss gathers biomass, Lux recovers salvage and Echo discovers insight. They reserve materials, share construction work and open a new district after each bridge. Six building plans repeat across districts. Three illustrated stages show the initial expansion; building counts keep growing beyond them.</p><p>Your habitat is saved on the server. The chronicle retains the latest 240 entries and each resident keeps their latest 80 memories.</p></div></DialogContent></Dialog>
      </div>
    </header>

    <main className="main-shell">
      <div className="page-heading"><div><div className="eyebrow"><span className="tiny-line" />EXPERIMENT 001 · WORLD BUILDING</div><h1>A world of their own<span>.</span></h1><p>Three lives. Shared ideas. A world growing beyond its edges.</p></div><div className="world-clock"><span className="eyebrow">HABITAT TIME</span><div>Day {clock.day}<span>/</span><strong>{clock.time}</strong></div></div></div>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button disabled={busy} onClick={() => void load()}>Reconnect</button></div>}

      <TabsContent value="observe" className="observe-view">
        <section className="world-column" aria-label="Habitat observation">
          <div className="world-panel">
            <div className="world-toolbar"><div className="world-status"><span className={playing && loaded ? "status-dot running" : "status-dot"} />{!loaded ? "Connecting to habitat" : playing ? "Life is unfolding" : "A moment of stillness"}</div><div className="playback"><button onClick={() => setSpeed(s => s === 4 ? 1 : s * 2)} className="speed-button" aria-label={`Simulation speed ${speed} times. Click to change.`}>{speed}×</button><span className="control-divider"/><button className="icon-button" disabled={!loaded} onClick={() => setPlaying(p => !p)} aria-label={playing ? "Pause simulation" : "Play simulation"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button><button className="icon-button" disabled={!loaded || busy} onClick={() => invoke({ type: "step" })} aria-label="Advance one step"><SkipForward size={17}/></button></div></div>
            <div className={`world-scene ${world.weather === "rain" ? "raining" : ""} ${world.power < 35 ? "low-power" : ""}`}>
              <img className="habitat-art" src={art} width="1536" height="1024" alt={stage === 2 ? "The expanded habitat with a garden, solar terrace, lookout, rain collector, workshop and a bridge to new land." : stage === 1 ? "The habitat has grown a cultivated garden, a solar terrace and a lookout beside its dome and pool." : "A miniature habitat under an open glass dome: a tree, a reflection pool and a glowing observatory on a floating island."} fetchPriority="high" />
              <div className="scene-coordinate top-left">DISTRICT {String(districtOf(world)).padStart(2, "0")}<span>{Object.values(world.settlement.built).reduce((a, b) => a + b, 0)} STRUCTURES BUILT</span></div>
              <span className="scene-corner corner-tl" aria-hidden="true"/><span className="scene-corner corner-br" aria-hidden="true"/>
              <div className="weather-badge">{world.weather === "rain" ? <CloudRain size={15}/> : <Sun size={15}/>}<span>{world.weather === "rain" ? "Gentle rain" : "Clear skies"}</span></div>
              <BuildingMarkers world={world}/>
              {world.residents.map(r => {
                const originalPlace = PLACES[r.location];
                const place = { ...originalPlace, x: stage === 2 ? originalPlace.x - (r.location === "pool" ? 3 : r.location === "grove" ? 4 : 5) : originalPlace.x };
                const peers = world.residents.filter(p => p.location === r.location), index = peers.findIndex(p => p.id === r.id);
                const offset = (index - (peers.length - 1) / 2) * 11;
                return <button key={r.id} className={`world-marker ${selected === r.id ? "active" : ""}`} style={{ left: `${50 + (place.x + offset - 50) * (1.5 / 1.72)}%`, top: `${place.y + (index % 2) * 7}%`, "--resident": PROFILES[r.id].color } as CSSProperties} onClick={() => setSelected(r.id)} aria-label={`Observe ${PROFILES[r.id].name} at ${place.name}`} aria-pressed={selected === r.id}><span className="marker-core"><Glyph id={r.id} size={19}/></span><span className="marker-name">{PROFILES[r.id].name}<ChevronRight size={11}/></span><span className="marker-ground"/></button>;
              })}
              <div className="scene-caption"><Compass size={14}/><span>Click a resident to follow their story</span></div>
            </div>
            <div className="world-metrics"><div><Leaf size={16}/><span>Growth</span><strong>{world.growth}<small>%</small></strong></div><div><Zap size={16}/><span>Power</span><strong>{world.power}<small>%</small></strong></div><div><Sparkles size={16}/><span>Discoveries</span><strong>{String(world.discoveries).padStart(2,"0")}</strong></div><div className="metrics-cycle">CYCLE <strong>{String(world.tick).padStart(3,"0")}</strong></div></div>
          </div>

          <ConstructionBoard world={world}/>

          <section className="residents-section" aria-labelledby="resident-heading"><div className="section-label"><h2 id="resident-heading">The residents <span>03</span></h2><span>Every one a little different</span></div><div className="resident-grid">{world.residents.map(r => <ResidentCard key={r.id} resident={r} selected={r.id === selected} onSelect={() => setSelected(r.id)}/>)}</div></section>

          <section className="interventions" aria-labelledby="event-heading"><div className="section-label"><h2 id="event-heading">A gentle nudge</h2><span>{remaining ? `${remaining} steps until this event settles` : "Change something. See what follows."}</span></div><div className="event-grid">{([{ id:"rain", icon:CloudRain, text:"Let something grow" },{ id:"relic", icon:Sparkles, text:"Give curiosity a reason" },{ id:"blackout", icon:ZapOff, text:"See who comes together" }] as const).map(event => <button key={event.id} className={`event-button ${world.intervention?.kind === event.id ? "event-active" : ""}`} onClick={() => invoke({ type:"event", event:event.id })} disabled={!loaded || busy || !!world.intervention}><event.icon size={21} strokeWidth={1.4}/><span><strong>{EVENT_LABELS[event.id]}</strong><small>{world.intervention?.kind === event.id ? "The habitat is responding…" : event.text}</small></span><ArrowUpRight size={14}/></button>)}</div></section>
        </section>

        <aside className="focus-panel" style={{ "--resident": profile.color } as CSSProperties} aria-label={`${profile.name}'s profile`}>
          <div className="focus-top"><span className="eyebrow">IN FOCUS</span><span className="profile-number">0{RESIDENT_IDS.indexOf(selected)+1} / 03</span></div>
          <div className="profile-identity"><Avatar id={selected} large/><div><h2>{profile.name}</h2><span>{profile.role}</span></div><span className="profile-mood">{moodLabel(resident.mood)}</span></div>
          <p className="profile-description">{profile.description}</p>
          <div className="traits">{profile.traits.map(t => <span key={t}>{t}</span>)}</div>
          <div className="thought"><span className="eyebrow"><Radio size={12}/> A PASSING THOUGHT</span><p>“{resident.thought}”</p><span className="thought-location"><MapPin size={13}/>{PLACES[resident.location].name}</span></div>
          <div className="needs"><div><span><BatteryMedium size={14}/>Energy</span><strong>{resident.energy}%</strong><Progress value={resident.energy} aria-label={`${profile.name}'s energy`}/></div><div><span><Heart size={14}/>Wellbeing</span><strong>{resident.mood}%</strong><Progress value={resident.mood} aria-label={`${profile.name}'s wellbeing`}/></div></div>
          <div className="purpose"><span className="eyebrow">A LITTLE PURPOSE</span><p><Flower2 size={17}/>{profile.goal}</p><span>{resident.progress} small steps toward it</span></div>
          <Tabs defaultValue="memories" className="profile-tabs"><TabsList variant="line" aria-label="Resident details"><TabsTrigger value="memories">Memories <span>{resident.memories.length}</span></TabsTrigger><TabsTrigger value="bonds">Connections</TabsTrigger></TabsList>
            <TabsContent value="memories"><div className="memory-list">{resident.memories.map(memory => <article className="memory" key={memory.id}><span className="memory-dot"/><div><span className="memory-meta">{memory.kind} <span>Day {worldTime(memory.tick).day} · {worldTime(memory.tick).time}</span></span><p>{memory.text}</p></div></article>)}</div>{resident.memories.length > 4 && <p className="retention-note">Showing {resident.memories.length} retained memories.</p>}</TabsContent>
            <TabsContent value="bonds"><div className="bond-list">{RESIDENT_IDS.filter(id=>id!==selected).map(id=><div className="bond" key={id}><Avatar id={id}/><div><strong>{PROFILES[id].name}<span>{resident.bonds[id]>=80?"A familiar presence":resident.bonds[id]>=65?"Growing closer":"Getting acquainted"}</span></strong><Progress value={resident.bonds[id]} aria-label={`Connection with ${PROFILES[id].name}`}/></div><span>{resident.bonds[id]}%</span></div>)}</div><p className="retention-note">Shared moments and facing the unexpected together bring residents closer.</p></TabsContent>
          </Tabs>
          <div className="recent-heading"><span className="eyebrow">JUST HAPPENED</span><span className="timeline-line"/></div><div className="recent-log">{world.chronicle.slice(0,2).map(entry=><Entry entry={entry} key={entry.id} compact/>)}</div>
        </aside>
      </TabsContent>

      <TabsContent value="chronicle"><section className="chronicle-panel"><div className="chronicle-heading"><div><span className="eyebrow">THE THINGS THAT STAY</span><h2>A life, in small moments.</h2><p>The habitat's encounters, discoveries and turning points, newest first.</p></div><span className="chronicle-total"><BookOpen size={24}/><strong>{world.totalMemories}</strong>memories made</span></div><div className="chronicle-list">{world.chronicle.map(entry=><Entry entry={entry} key={entry.id}/>)}</div><p className="retention-note">The latest {world.chronicle.length} of up to 240 chronicle entries are kept.</p></section></TabsContent>

      <footer className="footer"><span><Orbit size={15}/>A small world, still becoming.</span><div><span className="save-status" role="status">{loaded && !busy && !error ? <Check size={13}/> : <span className="status-dot"/>}{error ? "Connection needs attention" : status}</span><AlertDialog onOpenChange={open=>{if(open)setPlaying(false);}}><AlertDialogTrigger asChild><button className="reset-button" disabled={!loaded || busy}><RotateCcw size={13}/>New beginning</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Begin a new habitat?</AlertDialogTitle><AlertDialogDescription>This clears all buildings, resources, districts, memories, relationships and the chronicle for this habitat. Moss, Lux and Echo will start again from their first morning. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep this world</AlertDialogCancel><AlertDialogAction onClick={()=>invoke({type:"reset"})}>Begin again</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></footer>
    </main>
  </Tabs>;
}
