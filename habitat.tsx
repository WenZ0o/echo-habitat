"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, BatteryMedium, BookOpen, Check, ChevronRight, CircleHelp, CloudRain, Compass, Copy, Eye, Flower2, Heart, Leaf, Lock, MapPin, Orbit, Pause, Play, Radio, RotateCcw, SkipForward, Sparkles, Sprout, Sun, Zap, ZapOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createWorld } from "@/lib/habitat/engine";
import { BuildingMarkers, ConstructionBoard, DistrictExpansions, habitatStage } from "@/components/construction-board";
import { districtOf } from "@/lib/habitat/construction";
import { EVENT_LABELS, PLACES, PROFILES, RESIDENT_IDS, moodLabel, worldTime } from "@/lib/habitat/residents";
import type { ChronicleEntry, Intervention, OfflineSummary, Resident, ResidentId, WorldAction, WorldResponse } from "@/lib/habitat/types";

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
function formatAway(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

type Tool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean }; execute: (input: unknown) => unknown | Promise<unknown> };
type ModelContext = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };

export default function Habitat({ visitorMode = false }: { visitorMode?: boolean }) {
  const [data, setData] = useState<WorldResponse>(() => ({ world: createWorld(), revision: 0 }));
  const [selected, setSelected] = useState<ResidentId>("moss");
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(!visitorMode), [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const dataRef = useRef(data), loadedRef = useRef(false), lock = useRef(false);
  const accept = useCallback((next: WorldResponse) => { dataRef.current = next; setData(next); }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/habitat${visitorMode ? "?mode=visitor" : ""}`, { cache: "no-store" });
      const body = await res.json() as WorldResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? "The habitat could not be loaded.");
      if (!body.world || !Number.isInteger(body.revision)) throw new Error("The habitat returned an incomplete state. Please reconnect.");
      accept(body);
      if (body.offline?.steps) setOfflineSummary(body.offline);
      setLoaded(true);
      loadedRef.current = true;
      // A successful reconnect should resume the owner's autonomous simulation.
      // Visitor mode remains read-only and only polls for shared changes.
      if (!visitorMode) setPlaying(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection interrupted. Please try again.");
      setPlaying(false);
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [accept, visitorMode]);

  const act = useCallback(async (action: WorldAction): Promise<WorldResponse> => {
    if (visitorMode) throw new Error("Visitor mode is read-only.");
    if (!loadedRef.current) throw new Error("Wait for the habitat to load.");
    if (lock.current) throw new Error("A habitat action is already in progress.");
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/habitat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revision: dataRef.current.revision, action }) });
      const body = await res.json() as WorldResponse & { error?: string };
      if (res.status === 409 && body.world) {
        // Background simulation can occasionally race with a just-finished server write.
        // A step is safe to resync silently; explicit owner actions still surface a conflict.
        accept(body);
        if (action.type === "step") return body;
        throw new Error("The habitat changed while that action was being saved. The latest state is loaded; try the action once more.");
      }
      if (!res.ok) throw new Error(body.error ?? "Your change could not be saved.");
      if (!body.world || !Number.isInteger(body.revision)) throw new Error("Your change could not be confirmed. Please reconnect.");
      accept(body);
      return body;
    } catch (e) {
      // Automatic steps are best-effort. A short network/storage hiccup should not
      // permanently freeze the habitat; resync quietly and let the next cycle retry.
      if (action.type === "step") {
        try { await load(true); } catch { /* load() already records connection errors */ }
      } else {
        setError(e instanceof Error ? e.message : "Connection interrupted. Please try again.");
        setPlaying(false);
      }
      throw e;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [accept, visitorMode, load]);
  const invoke = (action: WorldAction) => { void act(action).catch(() => {}); };

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!loaded || visitorMode || !playing) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (delay: number) => {
      timer = setTimeout(async () => {
        if (cancelled) return;
        if (!document.hidden && !lock.current) {
          try { await act({ type: "step" }); } catch { /* next cycle will retry */ }
        }
        if (!cancelled) schedule(6500 / speed);
      }, delay);
    };

    // Make autonomous life visibly start soon after loading instead of making the
    // user wonder whether the play control worked.
    schedule(1200);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [loaded, visitorMode, playing, speed, act]);
  useEffect(() => {
    if (!loaded || !visitorMode) return;
    const interval = setInterval(() => { if (!document.hidden && !lock.current) void load(true); }, 15000);
    return () => clearInterval(interval);
  }, [loaded, visitorMode, load]);

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Tool) => { try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(e => console.warn("Habitat tool unavailable", e)); } catch (e) { console.warn("Habitat tool unavailable", e); } };
    register({ name: "read_habitat", title: "Read the habitat", description: "Read current world conditions, residents, memories and relationships without changing the habitat.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true },
      execute(input) { if (!input || typeof input !== "object" || Object.keys(input).length) throw new Error("Expected an empty object."); if (!loadedRef.current) throw new Error("Habitat is still loading."); return dataRef.current; } });
    if (!visitorMode) register({ name: "introduce_habitat_event", title: "Introduce a habitat event", description: "Introduce rain, a relic or a blackout, advance the habitat one turn, and save the resulting state. Fails while another event is active.",
      inputSchema: { type: "object", properties: { event: { type: "string", enum: ["rain", "relic", "blackout"] } }, required: ["event"], additionalProperties: false }, annotations: { readOnlyHint: false },
      async execute(input) {
        if (!input || typeof input !== "object" || Object.keys(input).length !== 1 || !["rain", "relic", "blackout"].includes(String((input as {event: string}).event))) throw new Error("Choose rain, relic or blackout.");
        const next = await act({ type: "event", event: (input as { event: Intervention }).event });
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        return { tick: next.world.tick, intervention: next.world.intervention, memories: next.world.totalMemories };
      } });
    return () => lifecycle.abort();
  }, [act, visitorMode]);

  const copyVisitorLink = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", "visitor");
    await navigator.clipboard.writeText(url.toString());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const world = data.world, clock = worldTime(world.tick), stage = habitatStage(world);
  const art = ["/habitat.png", "/habitat-growing.png", "/habitat-expanded.png"][stage];
  const resident = world.residents.find(item => item.id === selected)!;
  const profile = PROFILES[selected];
  const remaining = world.intervention?.remaining ?? 0;
  const status = !loaded ? "Connecting" : busy ? "Saving" : visitorMode ? "Read-only visitor" : "All changes saved";

  return <Tabs defaultValue="observe" className="habitat-app">
    <header className="topbar">
      <a className="brand" href={visitorMode ? "?mode=visitor" : "/"} aria-label="Echo Habitat home"><img src="/favicon.svg" width="37" height="37" alt="" /><span>ECHO<span className="brand-light">HABITAT</span></span><span className="version">03</span></a>
      <TabsList variant="line" className="main-nav" aria-label="Main navigation"><TabsTrigger value="observe"><Eye size={16} />Observe</TabsTrigger><TabsTrigger value="chronicle"><BookOpen size={16} />Chronicle<span className="nav-count">{world.chronicle.length}</span></TabsTrigger></TabsList>
      <div className="header-right">
        {visitorMode ? <span className="visitor-mode-label"><Lock size={13}/>Visitor mode</span> : <button className="visitor-link-button" onClick={() => void copyVisitorLink()}><Copy size={13}/>{copied ? "Copied" : "Visitor link"}</button>}
        <span className="simulation-label">Life simulation</span>
        <Dialog onOpenChange={open => { if (open && !visitorMode) setPlaying(false); }}><DialogTrigger asChild><button className="icon-button" aria-label="About this habitat"><CircleHelp size={19} /></button></DialogTrigger><DialogContent className="about-dialog"><DialogHeader><DialogTitle>A small world, unfolding.</DialogTitle><DialogDescription>ECHO HABITAT is an interactive life simulation. Three residents move, decide, remember and build together.</DialogDescription></DialogHeader><div className="about-body"><p>Select a resident to see their thoughts and memories. Their marker moves toward places, meetings and active construction sites as their priorities change.</p><p>Moss, Lux and Echo gather shared resources and hold a visible council before a new project begins. Building sites pass through foundation, frame and finishing stages, while completed bridges reveal new island fragments.</p><p>Closing the page no longer freezes the world. When someone returns, the server converts elapsed time into bounded simulation steps and reports the important things that happened while the habitat was unattended.</p><p>{visitorMode ? "You are viewing a read-only visitor link. You can inspect residents, memories and construction, but owner controls are disabled." : "Use Visitor link to copy a read-only URL for someone who only needs to watch the habitat."}</p></div></DialogContent></Dialog>
      </div>
    </header>

    <main className="main-shell">
      <div className="page-heading"><div><div className="eyebrow"><span className="tiny-line" />EXPERIMENT 001 · WORLD BUILDING</div><h1>A world of their own<span>.</span></h1><p>Three lives. Shared decisions. A world growing beyond its edges.</p></div><div className="world-clock"><span className="eyebrow">HABITAT TIME</span><div>Day {clock.day}<span>/</span><strong>{clock.time}</strong></div></div></div>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button disabled={busy} onClick={() => void load()}>Reconnect</button></div>}
      {offlineSummary && <div className="offline-banner" role="status"><div><Orbit size={18}/><span><strong>While the habitat was unattended</strong><small>{formatAway(offlineSummary.elapsedMs)} passed · {offlineSummary.steps} autonomous cycles · {offlineSummary.structuresBuilt} structures completed · {offlineSummary.decisionsMade} shared decisions</small></span></div><button onClick={() => setOfflineSummary(null)}>Dismiss</button></div>}
      {visitorMode && <div className="visitor-banner"><Lock size={16}/><span><strong>Visitor mode</strong> — watch, inspect and read. Controls that change the shared habitat are disabled.</span></div>}

      <TabsContent value="observe" className="observe-view">
        <section className="world-column" aria-label="Habitat observation">
          <div className="world-panel">
            <div className="world-toolbar"><div className="world-status"><span className={loaded && (visitorMode || playing) ? "status-dot running" : "status-dot"} />{!loaded ? "Connecting to habitat" : visitorMode ? "Observing the shared world" : playing ? "Life is unfolding" : "A moment of stillness"}</div>{visitorMode ? <span className="read-only-chip"><Lock size={12}/>Read only</span> : <div className="playback"><button onClick={() => setSpeed(value => value === 4 ? 1 : value * 2)} className="speed-button" aria-label={`Simulation speed ${speed} times. Click to change.`}>{speed}×</button><span className="control-divider"/><button className="icon-button" disabled={!loaded} onClick={() => setPlaying(value => !value)} aria-label={playing ? "Pause simulation" : "Play simulation"}>{playing ? <Pause size={16} /> : <Play size={16} />}</button><button className="icon-button" disabled={!loaded || busy} onClick={() => invoke({ type: "step" })} aria-label="Advance one step"><SkipForward size={17}/></button></div>}</div>
            <div className={`world-scene ${world.weather === "rain" ? "raining" : ""} ${world.power < 35 ? "low-power" : ""}`}>
              <img className="habitat-art" src={art} width="1536" height="1024" alt={stage === 2 ? "The expanded habitat with a garden, solar terrace, lookout, rain collector, workshop and a bridge to new land." : stage === 1 ? "The habitat has grown a cultivated garden, a solar terrace and a lookout beside its dome and pool." : "A miniature habitat under an open glass dome: a tree, a reflection pool and a glowing observatory on a floating island."} fetchPriority="high" />
              <DistrictExpansions world={world}/>
              <div className="scene-coordinate top-left">DISTRICT {String(districtOf(world)).padStart(2, "0")}<span>{Object.values(world.settlement.built).reduce((a, b) => a + b, 0)} STRUCTURES BUILT</span></div>
              <span className="scene-corner corner-tl" aria-hidden="true"/><span className="scene-corner corner-br" aria-hidden="true"/>
              <div className="weather-badge">{world.weather === "rain" ? <CloudRain size={15}/> : <Sun size={15}/>}<span>{world.weather === "rain" ? "Gentle rain" : "Clear skies"}</span></div>
              <BuildingMarkers world={world}/>
              {world.residents.map(item => {
                const shift = stage === 2 ? (item.location === "pool" ? -3 : item.location === "grove" ? -4 : -5) : 0;
                const x = item.position.x + shift;
                const left = 50 + (x - 50) * (1.5 / 1.72);
                return <button key={item.id} className={`world-marker ${selected === item.id ? "active" : ""}`} style={{ left: `${left}%`, top: `${item.position.y}%`, "--resident": PROFILES[item.id].color } as CSSProperties} onClick={() => setSelected(item.id)} aria-label={`Observe ${PROFILES[item.id].name} at ${PLACES[item.location].name}`} aria-pressed={selected === item.id} title={item.activity}><span className="marker-core"><Glyph id={item.id} size={19}/></span><span className="marker-name">{PROFILES[item.id].name}<ChevronRight size={11}/></span><span className="marker-ground"/></button>;
              })}
              <div className="scene-caption"><Compass size={14}/><span>{visitorMode ? "Select a resident to follow their story" : "Residents move as their priorities change"}</span></div>
            </div>
            <div className="world-metrics"><div><Leaf size={16}/><span>Growth</span><strong>{world.growth}<small>%</small></strong></div><div><Zap size={16}/><span>Power</span><strong>{world.power}<small>%</small></strong></div><div><Sparkles size={16}/><span>Discoveries</span><strong>{String(world.discoveries).padStart(2,"0")}</strong></div><div className="metrics-cycle">CYCLE <strong>{String(world.tick).padStart(3,"0")}</strong></div></div>
          </div>

          <ConstructionBoard world={world}/>
          <section className="residents-section" aria-labelledby="resident-heading"><div className="section-label"><h2 id="resident-heading">The residents <span>03</span></h2><span>Every one a little different</span></div><div className="resident-grid">{world.residents.map(item => <ResidentCard key={item.id} resident={item} selected={item.id === selected} onSelect={() => setSelected(item.id)}/>)}</div></section>

          {visitorMode ? <section className="visitor-observe-card"><Lock size={19}/><div><strong>Owner controls are hidden here.</strong><p>The visitor link can follow movement, councils, construction, memories and new districts without sending simulation actions.</p></div></section> : <section className="interventions" aria-labelledby="event-heading"><div className="section-label"><h2 id="event-heading">A gentle nudge</h2><span>{remaining ? `${remaining} steps until this event settles` : "Change something. See what follows."}</span></div><div className="event-grid">{([{ id:"rain", icon:CloudRain, text:"Let something grow" },{ id:"relic", icon:Sparkles, text:"Give curiosity a reason" },{ id:"blackout", icon:ZapOff, text:"See who comes together" }] as const).map(event => <button key={event.id} className={`event-button ${world.intervention?.kind === event.id ? "event-active" : ""}`} onClick={() => invoke({ type:"event", event:event.id })} disabled={!loaded || busy || !!world.intervention}><event.icon size={21} strokeWidth={1.4}/><span><strong>{EVENT_LABELS[event.id]}</strong><small>{world.intervention?.kind === event.id ? "The habitat is responding…" : event.text}</small></span><ArrowUpRight size={14}/></button>)}</div></section>}
        </section>

        <aside className="focus-panel" style={{ "--resident": profile.color } as CSSProperties} aria-label={`${profile.name}'s profile`}>
          <div className="focus-top"><span className="eyebrow">IN FOCUS</span><span className="profile-number">0{RESIDENT_IDS.indexOf(selected)+1} / 03</span></div>
          <div className="profile-identity"><Avatar id={selected} large/><div><h2>{profile.name}</h2><span>{profile.role}</span></div><span className="profile-mood">{moodLabel(resident.mood)}</span></div>
          <p className="profile-description">{profile.description}</p>
          <div className="traits">{profile.traits.map(trait => <span key={trait}>{trait}</span>)}</div>
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

      <TabsContent value="chronicle"><section className="chronicle-panel"><div className="chronicle-heading"><div><span className="eyebrow">THE THINGS THAT STAY</span><h2>A life, in small moments.</h2><p>The habitat's encounters, discoveries, decisions and turning points, newest first.</p></div><span className="chronicle-total"><BookOpen size={24}/><strong>{world.totalMemories}</strong>memories made</span></div><div className="chronicle-list">{world.chronicle.map(entry=><Entry entry={entry} key={entry.id}/>)}</div><p className="retention-note">The latest {world.chronicle.length} of up to 240 chronicle entries are kept.</p></section></TabsContent>

      <footer className="footer"><span><Orbit size={15}/>A small world, still becoming.</span><div><span className="save-status" role="status">{loaded && !busy && !error ? <Check size={13}/> : <span className="status-dot"/>}{error ? "Connection needs attention" : status}</span>{!visitorMode && <AlertDialog onOpenChange={open=>{if(open)setPlaying(false);}}><AlertDialogTrigger asChild><button className="reset-button" disabled={!loaded || busy}><RotateCcw size={13}/>New beginning</button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Begin a new habitat?</AlertDialogTitle><AlertDialogDescription>This clears all buildings, resources, districts, decisions, memories, relationships and the chronicle for this habitat. Moss, Lux and Echo will start again from their first morning. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep this world</AlertDialogCancel><AlertDialogAction onClick={()=>invoke({type:"reset"})}>Begin again</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</div></footer>
    </main>
  </Tabs>;
}
