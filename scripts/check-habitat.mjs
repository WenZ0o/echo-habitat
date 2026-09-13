import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
// Compile the actual TypeScript modules; substitute only the Cloudflare binding
// with SQLite's real prepared statements. No network or production writes.
function loadModule(file, dependencies = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'exports', 'module', compiled)(name => name in dependencies ? dependencies[name] : require(name), module.exports, module);
  return module.exports;
}
const residents = loadModule('lib/habitat/residents.ts');
const construction = loadModule('lib/habitat/construction.ts');
const engine = loadModule('lib/habitat/engine.ts', { './residents': residents, './construction': construction });

function apiHarness() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(name => name.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  }
  const DB = { prepare(sql) {
    const statement = sqlite.prepare(sql); let values = [];
    return { bind(...input) { values = input; return this; },
      async run() { const result = statement.run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
      async first() { return statement.get(...values) ?? null; } };
  } };
  const storage = loadModule('db/habitat.ts', { 'cloudflare:workers': { env: { DB } }, '@/lib/habitat/engine': engine });
  const api = loadModule('app/api/habitat/route.ts', { '@/db/habitat': storage });
  return { api, sqlite, close: () => sqlite.close() };
}
function request(action, revision = 0, extraHeaders = {}) {
  return new Request('https://habitat.test/api/habitat', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://habitat.test', ...extraHeaders }, body: JSON.stringify({ action, revision }) });
}

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
  assert.equal(world.settlement.project.blueprint, 'garden');
  assert.deepEqual(world.settlement.resources, { biomass: 88, salvage: 96, insight: 100 });
  const reserved = structuredClone(world.settlement.resources);
  const resumed = JSON.parse(JSON.stringify(world));
  assert.deepEqual(engine.evolveWorld(resumed, { type: 'step' }), engine.evolveWorld(world, { type: 'step' }));
  world = engine.evolveWorld(world, { type: 'step' });
  assert.deepEqual(world.settlement.resources, reserved, 'materials must not be charged again while building');
  assert.ok(Object.values(world.settlement.project.contributions).every(work => work > 0), 'all residents contribute');
  for (let i = 0; i < 20 && !world.settlement.built.garden; i++) world = engine.evolveWorld(world, { type: 'step' });
  assert.equal(world.settlement.built.garden, 1);
  assert.equal(world.settlement.project, null);
  for (const resident of world.residents) {
    assert.ok(resident.memories.some(memory => memory.kind === 'building' && memory.text.includes('Living garden is complete')));
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
test('a version 1 SQLite save upgrades without resetting history and saves under its existing revision', async () => {
  const { api, sqlite, close } = apiHarness();
  try {
    let old = engine.evolveWorld(engine.createWorld(), { type: 'event', event: 'relic' });
    delete old.settlement; old.version = 1;
    sqlite.prepare('INSERT INTO habitats (id, state, revision) VALUES (?, ?, ?)').run('main', JSON.stringify(old), 7);
    const loaded = await (await api.GET()).json();
    assert.equal(loaded.revision, 7); assert.equal(loaded.world.version, 2);
    assert.equal(loaded.world.tick, old.tick);
    assert.deepEqual(loaded.world.residents, old.residents);
    assert.deepEqual(loaded.world.chronicle, old.chronicle);
    assert.deepEqual(loaded.world.settlement, construction.createSettlement());
    assert.equal((await api.POST(request({ type: 'step' }, 7))).status, 200);
    const saved = JSON.parse(sqlite.prepare('SELECT state FROM habitats WHERE id = ?').get('main').state);
    assert.equal(saved.version, 2); assert.equal(saved.tick, old.tick + 1);
    assert.ok(saved.settlement);
    assert.equal((await api.POST(request({ type: 'step' }, 7))).status, 409);
    assert.equal((await api.POST(request({ type: 'reset' }, 8))).status, 200);
    assert.deepEqual((await (await api.GET()).json()).world.settlement, construction.createSettlement());
  } finally { close(); }
});
test('API stores the world in SQLite and reloads it with the same revision', async () => {
  const { api, close } = apiHarness();
  try {
    const initial = await (await api.GET()).json(); assert.equal(initial.revision, 0);
    const changed = await api.POST(request({ type: 'event', event: 'relic' }));
    assert.equal(changed.status, 200);
    const saved = await changed.json(), loaded = await (await api.GET()).json();
    assert.equal(loaded.revision, 1); assert.deepEqual(loaded.world, saved.world);
    assert.ok(loaded.world.discoveries > 0);
  } finally { close(); }
});
test('concurrent and stale actions cannot overwrite newer memories', async () => {
  const { api, close } = apiHarness();
  try {
    await api.GET();
    const responses = await Promise.all([api.POST(request({ type: 'step' })), api.POST(request({ type: 'step' }))]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const loaded = await (await api.GET()).json(); assert.equal(loaded.revision, 1); assert.equal(loaded.world.tick, 1);
    const stale = await api.POST(request({ type: 'reset' }, 0)); assert.equal(stale.status, 409);
    assert.equal((await (await api.GET()).json()).revision, 1);
  } finally { close(); }
});
test('invalid input, cross-site writes and overlapping interventions fail safely', async () => {
  const { api, close } = apiHarness();
  try {
    assert.equal((await api.POST(request({ type: 'event', event: 'unknown' }))).status, 400);
    assert.equal((await api.POST(request({ type: 'step' }, -1))).status, 400);
    assert.equal((await api.POST(request({ type: 'step' }, 0, { Origin: 'https://elsewhere.test' }))).status, 403);
    assert.equal((await api.POST(request({ type: 'event', event: 'rain' }))).status, 200);
    assert.equal((await api.POST(request({ type: 'event', event: 'relic' }, 1))).status, 422);
    const after = await (await api.GET()).json(); assert.equal(after.revision, 1); assert.equal(after.world.weather, 'rain');
    assert.equal((await api.POST(request({ type: 'reset' }, 1))).status, 200);
    const reset = await (await api.GET()).json(); assert.equal(reset.revision, 2); assert.equal(reset.world.tick, 0); assert.equal(reset.world.totalMemories, 3);
  } finally { close(); }
});
