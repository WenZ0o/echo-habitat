import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadModule(file, dependencies = {}) {
  const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", compiled)(name => name in dependencies ? dependencies[name] : require(name), loaded.exports, loaded);
  return loaded.exports;
}
const residents = loadModule("lib/habitat/residents.ts");
const construction = loadModule("lib/habitat/construction.ts");
const engine = loadModule("lib/habitat/engine.ts", { "./residents": residents, "./construction": construction });
const visits = loadModule("lib/habitat/return-visit.ts");
const OWNER = { "oai-authenticated-user-id": "site-scoped-owner", "oai-authenticated-user-email": "owner@example.test" };
const secret = "test-only-owner-key-with-at-least-32-random-characters";

function apiHarness() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync(new URL("../drizzle/", import.meta.url)).filter(name => name.endsWith(".sql")).sort()) sqlite.exec(readFileSync(new URL("../drizzle/" + file, import.meta.url), "utf8"));
  const DB = { prepare(sql) {
    const statement = sqlite.prepare(sql); let values = [];
    return { bind(...input) { values = input; return this; },
      async run() { const result = statement.run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
      async first() { return statement.get(...values) ?? null; } };
  } };
  const env = { DB, HABITAT_OWNER_EMAIL: "owner@example.test" };
  const runtime = loadModule("db/runtime.sites.ts", { "cloudflare:workers": { env } });
  const access = loadModule("lib/habitat/access.ts", { "@/db/runtime": runtime });
  const driver = loadModule("db/storage-driver.sites.ts", { "cloudflare:workers": { env } });
  const storage = loadModule("db/habitat.ts", { "@/db/storage-driver": driver, "@/lib/habitat/engine": engine });
  const api = loadModule("app/api/habitat/route.ts", { "@/db/habitat": storage, "@/lib/habitat/access": access });
  return { api, storage, sqlite, driver, env, close: () => sqlite.close() };
}
function request(action, actionRevision = 0, extraHeaders = OWNER, query = "") {
  return new Request("https://habitat.test/api/habitat" + query, { method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://habitat.test", ...extraHeaders }, body: JSON.stringify({ action, actionRevision }) });
}
function getRequest(headers = OWNER, query = "") { return new Request("https://habitat.test/api/habitat" + query, { headers }); }

test('every intervention has a distinct, persistent effect and expires after four steps', () => {
  const initial = engine.createWorld();
  const original = JSON.stringify(initial);
  const rain = engine.evolveWorld(initial, { type: 'event', event: 'rain' });
  assert.equal(rain.weather, 'rain'); assert.ok(rain.growth > initial.growth);
  const relic = engine.evolveWorld(initial, { type: 'event', event: 'relic' });
  assert.ok(relic.discoveries > initial.discoveries);
  assert.ok(relic.residents.find(r => r.id === 'echo').memories.some(m => m.kind === 'discovery'));
  const blackout = engine.evolveWorld(initial, { type: 'event', event: 'blackout' });
  assert.ok(blackout.power > 12); assert.ok(blackout.power < initial.power);
  assert.ok(blackout.residents.find(r => r.id === 'moss').bonds.lux > 50);
  for (let world of [rain, relic, blackout]) {
    const memoryCount = world.totalMemories;
    for (let i = 0; i < 3; i++) world = engine.evolveWorld(world, { type: 'step' });
    assert.equal(world.intervention, null); assert.equal(world.weather, 'clear');
    assert.ok(world.totalMemories >= memoryCount);
  }
  assert.equal(JSON.stringify(initial), original, 'updates must not mutate a previous world');
});
test('saved state resumes deterministically and long runs remain bounded', () => {
  let world = engine.createWorld();
  for (let i = 0; i < 600; i++) {
    world = engine.evolveWorld(world, { type: 'step' });
    for (const metric of [world.power, world.growth]) assert.ok(metric >= 0 && metric <= 100);
    for (const resident of world.residents) {
      for (const metric of [resident.energy, resident.mood, ...Object.values(resident.bonds)]) assert.ok(metric >= 0 && metric <= 100);
      assert.ok(resident.memories.length <= 80);
      for (const other of world.residents) if (resident.id !== other.id) assert.equal(resident.bonds[other.id], other.bonds[resident.id]);
    }
    assert.ok(world.chronicle.length <= 240);
    assert.equal(new Set(world.chronicle.map(entry => entry.id)).size, world.chronicle.length, 'chronicle entries need unique keys even after retention fills');
    for (const amount of Object.values(world.settlement.resources)) assert.ok(amount >= 0 && amount <= construction.RESOURCE_CAP);
  }
  const resumed = JSON.parse(JSON.stringify(world));
  assert.deepEqual(engine.evolveWorld(resumed, { type: 'step' }), engine.evolveWorld(world, { type: 'step' }));
  assert.ok(world.totalMemories > 240);
});
test('overlapping events are rejected without corrupting the current world', () => {
  const world = engine.evolveWorld(engine.createWorld(), { type: 'event', event: 'rain' });
  const before = JSON.stringify(world);
  assert.throws(() => engine.evolveWorld(world, { type: 'event', event: 'relic' }), /Wait for/);
  assert.equal(JSON.stringify(world), before);
});
test('residents reserve materials once, cooperate, and finish a building without a build command', () => {
  const initial = engine.createWorld();
  initial.settlement.resources = { biomass: 100, salvage: 100, insight: 100 };
  const snapshot = JSON.stringify(initial);
  let world = engine.evolveWorld(initial, { type: 'step' });
  const chosen = construction.BLUEPRINTS.find(item => item.id === world.settlement.project.blueprint);
  const cost = construction.blueprintCost(chosen, 1);
  for (const resource of construction.RESOURCE_IDS) assert.equal(world.settlement.resources[resource], 100 - cost[resource]);
  assert.ok(world.settlement.decision.reasons.moss);
  assert.equal(world.councilsMade, 1);
  const reserved = structuredClone(world.settlement.resources);
  const resumed = JSON.parse(JSON.stringify(world));
  assert.deepEqual(engine.evolveWorld(resumed, { type: 'step' }), engine.evolveWorld(world, { type: 'step' }));
  world = engine.evolveWorld(world, { type: 'step' });
  assert.deepEqual(world.settlement.resources, reserved, 'materials must not be charged again while building');
  assert.ok(Object.values(world.settlement.project.contributions).every(work => work > 0), 'all residents contribute');
  for (let i = 0; i < 20 && !world.settlement.built[chosen.id]; i++) world = engine.evolveWorld(world, { type: 'step' });
  assert.equal(world.settlement.built[chosen.id], 1);
  assert.equal(world.settlement.project, null);
  for (const resident of world.residents) {
    assert.ok(resident.memories.some(memory => memory.kind === 'building' && memory.text.includes(chosen.name + ' is complete')));
    assert.ok(resident.bonds[resident.id === 'moss' ? 'lux' : 'moss'] > 50);
  }
  assert.equal(JSON.stringify(initial), snapshot);
});
test('building continues into new districts and permanent structures improve supplies', () => {
  let world = engine.createWorld();
  for (let i = 0; i < 300; i++) world = engine.evolveWorld(world, { type: 'step' });
  assert.ok(world.settlement.built.bridge >= 1, 'a bridge opens more ground without user intervention');
  assert.ok(world.settlement.built.garden >= 2, 'the next district must also be developed');
  assert.ok(construction.districtOf(world) >= 2);
  const plain = engine.createWorld(), developed = engine.createWorld();
  plain.settlement.resources = { biomass: 0, salvage: 0, insight: 0 };
  developed.settlement.resources = { biomass: 0, salvage: 0, insight: 0 };
  for (const id of Object.keys(developed.settlement.built)) developed.settlement.built[id] = 1;
  const before = engine.evolveWorld(plain, { type: 'step' }), after = engine.evolveWorld(developed, { type: 'step' });
  assert.equal(after.power, before.power + 1);
  assert.equal(after.growth, before.growth + 1);
  for (const resource of construction.RESOURCE_IDS) assert.ok(after.settlement.resources[resource] > before.settlement.resources[resource]);
});
test('rest and emergencies take priority while a construction project survives intact', () => {
  const initial = engine.createWorld();
  initial.settlement.project = { blueprint: 'garden', district: 1, startedAt: 0, work: 3, contributions: { moss: 1, lux: 1, echo: 1 } };
  const tired = structuredClone(initial);
  tired.residents.forEach(resident => { resident.energy = 0; });
  const resting = engine.evolveWorld(tired, { type: 'step' });
  assert.equal(resting.settlement.project.work, 3);
  assert.ok(resting.residents.every(resident => resident.energy > 0));
  const blackout = engine.evolveWorld(initial, { type: 'event', event: 'blackout' });
  assert.equal(blackout.settlement.project.work, 3);
  assert.ok(blackout.power > 12);
  assert.deepEqual(blackout.settlement.resources, initial.settlement.resources);
});


test("the shared clock preserves remainders, backlog and deterministic history", () => {
  const start = 100000;
  const initial = engine.createWorld(4173, start);
  const now = start + 1000 * engine.CLOCK_STEP_MS + 1234;
  let partial = engine.advanceOffline(initial, now, 300).world;
  assert.equal(partial.tick, 300); assert.equal(engine.pendingSteps(partial, now), 700);
  while (engine.pendingSteps(partial, now)) partial = engine.advanceOffline(partial, now, 300).world;
  const complete = engine.advanceOffline(initial, now, 1000).world;
  assert.deepEqual(partial, complete);
  assert.equal(partial.lastActiveAt, now - 1234);
  assert.equal(engine.advanceOffline(partial, now).summary, undefined);
  assert.equal(initial.tick, 0);
  assert.equal(engine.advanceOffline(partial, start - 1).world.lastActiveAt, partial.lastActiveAt, "clock rollback must not replay time");
});
test("a full day at 4x fits one cron budget and still has bounded memory", context => {
  const world = engine.createWorld(4173, 100000); world.clock.speed = 4;
  const start = performance.now();
  const advanced = engine.advanceOffline(world, 100000 + 86400000, 60000).world;
  context.diagnostic("Full-day catch-up: " + Math.round(performance.now() - start) + "ms");
  assert.equal(engine.pendingSteps(advanced, 100000 + 86400000), 0);
  assert.equal(advanced.tick, Math.floor(86400000 / (6500 / 4)));
  assert.ok(advanced.chronicle.length <= 240);
  for (const resident of advanced.residents) assert.ok(resident.memories.length <= 80);
  assert.ok(advanced.settlement.built.bridge > 10);
});
test("new councils wait for rest and emergencies instead of consuming those events", () => {
  const initial = engine.createWorld(); initial.settlement.resources = { biomass: 100, salvage: 100, insight: 100 };
  initial.residents[0].energy = 0;
  const rested = engine.evolveWorld(initial, { type: "step" });
  assert.equal(rested.settlement.project, null); assert.ok(rested.residents[0].energy > 0);
  for (const event of ["rain", "relic", "blackout"]) {
    const ready = engine.createWorld(); ready.settlement.resources = { biomass: 100, salvage: 100, insight: 100 };
    const next = engine.evolveWorld(ready, { type: "event", event });
    assert.equal(next.settlement.decision, null);
    assert.ok(next.residents.some(resident => resident.activity !== ready.residents.find(old => old.id === resident.id).activity));
  }
});
test("version 1, 2 and 3 saves preserve history and migrate once under CAS", async () => {
  for (const version of [1, 2, 3]) {
    const { storage, sqlite, close } = apiHarness();
    try {
      const old = engine.evolveWorld(engine.createWorld(), { type: "event", event: "relic" });
      old.version = version;
      for (const key of ["epoch", "clock", "actionRevision", "councilsMade"]) delete old[key];
      for (const resident of old.residents) { delete resident.district; delete resident.carrying; if (version < 3) delete resident.position; }
      if (version === 1) delete old.settlement;
      if (version === 2) delete old.settlement.decision;
      sqlite.prepare("INSERT INTO habitats (id, state, revision) VALUES (?, ?, ?)").run("main", JSON.stringify(old), 7);
      const loaded = await storage.readHabitat(100000);
      assert.equal(loaded.revision, 8); assert.equal(loaded.world.version, 4);
      assert.equal(loaded.world.tick, old.tick); assert.equal(loaded.world.lastActiveAt, 100000);
      assert.deepEqual(loaded.world.chronicle, old.chronicle);
      assert.deepEqual(loaded.world.residents[0].memories, old.residents[0].memories);
      assert.equal((await storage.readHabitat(100000)).revision, 8);
      const saved = JSON.parse(sqlite.prepare("SELECT state FROM habitats WHERE id = ?").get("main").state);
      assert.equal(saved.version, 4);
    } finally { close(); }
  }
});
test("simultaneous observers advance one clock; simultaneous commands have one winner", async () => {
  const { storage, close } = apiHarness();
  try {
    await storage.readHabitat(100000);
    const reads = await Promise.all(Array.from({ length: 8 }, () => storage.readHabitat(113000)));
    assert.ok(reads.every(result => result.world.tick === 2));
    const actions = await Promise.all([storage.updateHabitat({ type: "step" }, 0, 113000), storage.updateHabitat({ type: "step" }, 0, 113000)]);
    assert.equal(actions.filter(result => !result.conflict).length, 1);
    const current = await storage.readHabitat(113000);
    assert.equal(current.world.tick, 3); assert.equal(current.world.actionRevision, 1);
    assert.equal((await storage.updateHabitat({ type: "reset" }, 0, 113000)).conflict, true);
  } finally { close(); }
});
test("clock writes do not invalidate owner actions and paused time never catches up", async () => {
  const { storage, close } = apiHarness();
  try {
    await storage.readHabitat(100000);
    await storage.readHabitat(113000);
    const paused = await storage.updateHabitat({ type: "playback", running: false, speed: 2 }, 0, 113000);
    assert.equal(paused.conflict, false); assert.equal(paused.world.tick, 2);
    assert.equal((await storage.readHabitat(900000)).world.tick, 2);
    const resumed = await storage.updateHabitat({ type: "playback", running: true, speed: 2 }, 1, 900000);
    assert.equal(resumed.world.lastActiveAt, 900000);
    assert.equal((await storage.readHabitat(903250)).world.tick, 3);
    const reset = await storage.updateHabitat({ type: "reset" }, 2, 903250);
    assert.equal(reset.world.tick, 0); assert.equal(reset.world.epoch, 903250);
    assert.equal(reset.world.actionRevision, 3);
  } finally { close(); }
});
test("API rejects visitors, spoofed modes, other users, cross-site writes and invalid actions", async () => {
  const { api, close } = apiHarness();
  try {
    assert.equal((await (await api.GET(getRequest({}))).json()).mode, "visitor");
    assert.equal((await api.POST(request({ type: "reset" }, 0, {}, "?mode=owner"))).status, 403);
    assert.equal((await api.POST(request({ type: "reset" }, 0, { ...OWNER, "oai-authenticated-user-email": "friend@example.test" }))).status, 403);
    assert.equal((await api.POST(request({ type: "reset" }, 0, OWNER, "?mode=visitor"))).status, 403);
    assert.equal((await api.POST(request({ type: "step" }, 0, { ...OWNER, Origin: "https://elsewhere.test" }))).status, 403);
    assert.equal((await api.POST(request({ type: "playback", running: true, speed: 100 }))).status, 400);
    assert.equal((await api.POST(request({ type: "step" }, -1))).status, 400);
    assert.equal((await api.POST(request({ type: "event", event: "rain" }))).status, 200);
    assert.equal((await api.POST(request({ type: "event", event: "relic" }, 1))).status, 422);
    const saved = await (await api.GET(getRequest())).json();
    assert.equal(saved.mode, "owner"); assert.equal(saved.world.weather, "rain");
    assert.equal((await api.POST(request({ type: "reset" }, 1))).status, 200);
  } finally { close(); }
});
test("Vercel never trusts identity headers; owner cookies expire and secret rotation revokes them", async () => {
  const configured = { HABITAT_OWNER_KEY: secret };
  const plainRuntime = loadModule("db/runtime.ts");
  assert.equal(plainRuntime.trustedOwner(getRequest(OWNER)), false);
  const runtime = { ...plainRuntime, setting: name => configured[name] ?? "" };
  const access = loadModule("lib/habitat/access.ts", { "@/db/runtime": runtime });
  const now = Date.now();
  assert.equal(await access.isOwner(getRequest(OWNER), now), false);
  assert.equal(await access.verifyOwnerKey("wrong"), false);
  assert.equal(await access.verifyOwnerKey(secret), true);
  const setCookie = await access.ownerCookie(getRequest(), false, now);
  assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/); assert.match(setCookie, /Secure/);
  const cookie = setCookie.split(";")[0];
  assert.equal(await access.isOwner(getRequest({ cookie }), now), true);
  assert.equal(await access.isOwner(getRequest({ cookie }, "?mode=visitor"), now), false);
  assert.equal(await access.isOwner(getRequest({ cookie: cookie.replace(/\.[a-f0-9]+$/, "." + "0".repeat(64)) }), now), false);
  assert.equal(await access.isOwner(getRequest({ cookie }), now + 8 * 86400000), false);
  configured.HABITAT_OWNER_KEY = secret + "rotated";
  assert.equal(await access.isOwner(getRequest({ cookie }), now), false);
  configured.HABITAT_OWNER_KEY = "";
  assert.equal(await access.isOwner(getRequest({ cookie }), now), false);
});
test("sign-in and cron endpoints fail closed and only accept their own credentials", async () => {
  const runtime = { setting: name => name === "HABITAT_OWNER_KEY" ? secret : name === "CRON_SECRET" ? secret + "-cron" : "", trustedOwner: () => false, ownerSignInUrl: () => undefined };
  const access = loadModule("lib/habitat/access.ts", { "@/db/runtime": runtime });
  const auth = loadModule("app/api/access/route.ts", { "@/lib/habitat/access": access });
  const login = key => new Request("https://habitat.test/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
  assert.equal((await auth.POST(login("wrong"))).status, 401);
  assert.equal((await auth.POST(login(secret))).status, 200);
  let calls = 0;
  const cron = loadModule("app/api/cron/route.ts", { "@/db/runtime": runtime, "@/lib/habitat/access": access, "@/db/habitat": { readHabitat: async () => { calls++; return { world: { tick: 1 }, pendingSteps: 0 }; } } });
  assert.equal((await cron.GET(new Request("https://habitat.test/api/cron"))).status, 401);
  assert.equal((await cron.GET(new Request("https://habitat.test/api/cron", { headers: { authorization: "Bearer " + secret } }))).status, 401);
  assert.equal(calls, 0);
  assert.equal((await cron.GET(new Request("https://habitat.test/api/cron", { headers: { authorization: "Bearer " + secret + "-cron" } }))).status, 200);
  assert.equal(calls, 1);
});
test("private Blob driver requires conditional writes and never treats a storage failure as an empty world", async () => {
  class Precondition extends Error {}
  let saved = null, counter = 0, readOptions, writeOptions, broken = false;
  const sdk = {
    BlobPreconditionFailedError: Precondition,
    async get(_path, options) {
      readOptions = options;
      if (broken) return { statusCode: 500 };
      if (!saved) return null;
      return { statusCode: 200, stream: new Response(JSON.stringify(saved.data)).body, blob: { etag: saved.etag } };
    },
    async put(_path, data, options) {
      writeOptions = options;
      if (saved && (!options.allowOverwrite || options.ifMatch !== saved.etag)) throw new Precondition();
      const etag = "etag-" + ++counter; saved = { data: JSON.parse(data), etag }; return { etag };
    },
  };
  const { habitatStore } = loadModule("db/storage-driver.ts", { "@vercel/blob": sdk });
  const initial = await habitatStore.initialize(engine.createWorld());
  const next = engine.evolveWorld(initial.world, { type: "step" });
  const winner = await habitatStore.compareAndSwap(initial, next);
  assert.equal(winner.revision, 1); assert.equal(writeOptions.ifMatch, initial.etag);
  assert.equal(writeOptions.access, "private");
  assert.equal(await habitatStore.compareAndSwap(initial, engine.createWorld()), null);
  const loaded = await habitatStore.read(); assert.deepEqual(loaded.world, next);
  assert.equal(readOptions.useCache, false);
  broken = true; await assert.rejects(() => habitatStore.read(), /incomplete/);
});
test("return summaries belong to each browser and ignore resets or corrupt local storage", () => {
  const initial = engine.createWorld(4173, 100000);
  const marker = visits.visitMarker(initial, 100000);
  const advanced = engine.advanceOffline(initial, 100000 + 500 * 6500, 500).world;
  const summary = visits.summarizeVisit(marker, advanced, 100000 + 500 * 6500);
  assert.equal(summary.steps, 500); assert.ok(summary.structuresBuilt > 0); assert.ok(summary.decisionsMade > 0);
  assert.deepEqual(summary, visits.summarizeVisit(marker, advanced, 100000 + 500 * 6500), "another reader cannot consume this summary");
  assert.equal(visits.parseVisit("bad JSON"), null);
  assert.equal(visits.parseVisit('{"at":"yesterday"}'), null);
  const reset = engine.createWorld(4173, 200000);
  assert.equal(visits.summarizeVisit(marker, reset, 10000000), null);
});

