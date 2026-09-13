# ECHO HABITAT

A small world, unfolding. Three digital residents share a greenhouse habitat, make decisions, remember encounters, and build their world together.

![The habitat](public/habitat.png)

## What you can do

- Observe **Moss**, the keeper; **Lux**, the maker; and **Echo**, the seeker.
- Select residents on the map or in their cards to inspect thoughts, energy, wellbeing, memories and connections.
- Watch the residents gather biomass, salvage and insight, reserve materials, and collaborate on six building plans.
- Follow construction progress, individual contributions, completed structures and newly opened districts. Each bridge starts another settlement cycle automatically.
- Introduce rain, an unknown object, or a power interruption. Each has distinct consequences and lasts four simulation steps.
- Pause, advance by one step, or change playback speed to 1×, 2× or 4×.
- Revisit the chronicle and resume the same saved world after reloading.
- Start over through a confirmation dialog.

**This is a rule-driven life simulation with authored dialogue. It does not call an LLM, train a model, or represent conscious beings.** Three generated map illustrations show the original habitat, its first garden/solar/lookout expansion, and its completed first district. The artwork changes after the first lookout and bridge; later districts continue through live counts, construction markers and the district trail. It is not a procedurally rendered infinite map. No model API key is required.

Simulation advances while the page is visible and playback is enabled. There is no background scheduler. Multiple tabs share the same habitat; optimistic revision checks prevent a stale tab from overwriting a newer state. A reset clears this shared world's history.

## Stack and layout

React + TypeScript, Vinext/Vite, Cloudflare Workers and D1 (SQLite), with generated Drizzle migrations. Matching accessible controls use the bundled Shadcn/Radix primitives.

| Path | Responsibility |
| --- | --- |
| `components/habitat.tsx` | Interactive map, resident inspector, chronicle, playback and event controls |
| `components/construction-board.tsx` | Resource stores, building progress, contributions, structure markers and district trail |
| `app/globals.css` | Responsive visual design and reduced-motion behavior |
| `lib/habitat/types.ts` | Shared world, resident, event and memory types |
| `lib/habitat/residents.ts` | Resident personalities, goals and map locations |
| `lib/habitat/engine.ts` | Pure, seeded simulation transitions |
| `lib/habitat/construction.ts` | Building plans, costs, work requirements, resources and district progression |
| `app/api/habitat/route.ts` | Validated HTTP API and same-origin checks |
| `db/habitat.ts` | Prepared D1 queries and optimistic concurrency |
| `db/schema.ts`, `drizzle/` | Database schema and versioned migrations |
| `scripts/check-habitat.mjs` | Engine and API/storage tests using real local SQLite |

The decision order is: recover low energy, address role-specific emergencies, react to an active event, gather or build, interact with a nearby resident, explore, then pursue the resident's own purpose. Every fourth cycle leaves space for encounters, exploration and maintenance. Selected discovery memories can be shared during encounters. Bonds change through interaction and affect the resident's dialogue. New memories and chronicle entries are saved with the resulting state.

## Autonomous world building

Moss gathers **biomass**, Lux recovers **salvage**, and Echo gains **insight**. The next affordable plan starts automatically; materials are deducted exactly once. Its lead contributes two work units per building action and other residents contribute one. Construction survives rest, interventions and reloads. Completion creates permanent benefits, shared memories and stronger bonds between contributors.

| Plan | Lead | Permanent effect |
| --- | --- | --- |
| Living garden | Moss | +1 growth per cycle per garden, up to +2 |
| Sun terrace | Lux | +1 power per cycle per terrace, up to +3 |
| Lookout | Echo | +1 insight per gathering action per lookout, up to +3 |
| Rain collector | Moss | +1 biomass per gathering action per collector, up to +3 |
| Shared workshop | Lux | +1 salvage per gathering action per workshop, up to +3 |
| Bridge outward | Echo | Opens the next district and repeats the plan sequence |

Each district repeats these six plans. Costs and work rise for later districts, then plateau so the settlement can keep expanding. Stores are capped at 250 of each resource; structure counts remain cumulative without an ever-growing building array. Rain provides extra biomass and relic study provides extra insight. Rest and emergency repairs still take priority.

Version 1 saved worlds are upgraded in memory without resetting the clock, residents, memories, relationships or chronicle. The new settlement fields are written on the next successful action using the existing optimistic revision check. The deployed SQL migration does not change.

Retention is bounded to the most recent **80 memories per resident** and **240 chronicle entries**. The total-memory counter remains cumulative. A single shared world is intentional for the initial private deployment. Add application-level identity and world ownership before turning this into a multi-user service.

## Run locally

Use Node.js **24** and pnpm **11.25.0** (the version in `packageManager`). The committed `pnpm-lock.yaml` is authoritative.

```sh
pnpm install --frozen-lockfile
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_silly_pestilence.sql
pnpm dev
```

Run the migration command once for a fresh local database, then open the address printed by `pnpm dev`. Subsequent starts only need `pnpm dev`. Local state lives in ignored `.wrangler/state`. Production and local data are separate. Local builds require no Cloudflare login.

The checkout-local Sites execution profile is ignored. The same starter chooses its portable mode outside the managed environment; its scripts remain part of the source. Hosting uses the Cloudflare-compatible output in `dist/server/` and `dist/client/`.

## Verify

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

The ten tests cover distinct event outcomes and expiry, deterministic save/resume, 600-step bounds, unique chronicle keys, immutable transitions, one-time material reservation, collaborative construction, repeated district expansion, permanent building benefits, emergency/rest priorities, version 1 SQLite save upgrades, persistence, concurrent and stale revisions, invalid input, cross-site writes, event overlap, and reset. They compile and execute the actual source modules and substitute only the Cloudflare binding with a SQLite adapter. They do not exercise the browser or a deployed Cloudflare instance.

WebMCP tools (`read_habitat`, `introduce_habitat_event`) are registered only if the browser provides `document.modelContext`. They use the same state/actions as the interface. Their live browser integration has not been verified in this environment and is optional to the application.

## API

- `GET /api/habitat` returns `{ world, revision }`, initializing a fresh world if needed.
- `POST /api/habitat` accepts `{ revision, action }` with `action` equal to `{ type: "step" }`, `{ type: "event", event: "rain" | "relic" | "blackout" }`, or `{ type: "reset" }`.
- `409` returns the latest state after a revision conflict; the client pauses and reloads that state.
- `422` rejects an event while another is active. Failed storage operations return `503`; the client pauses and exposes a recovery action.

## GitHub

This source includes a README, a German quickstart, a lockfile and a verification workflow. Extract the source ZIP and upload the contents to a new GitHub repository, with `package.json` at its root. GitHub's browser upload accepts up to 100 files per batch: upload `components/` first, commit, then upload the remaining files and folders at the repository root and commit again. The ZIP itself is not the repository source layout. GitHub upload does not deploy this database-backed app to GitHub Pages.

Official guides: [Create a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [upload files and limits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

See [START-DE.md](START-DE.md) for the short German guide.

## Inspiration and artwork

Conceptual inspiration: [Cantrip](https://github.com/deepfates/cantrip), [Textile](https://github.com/deepfates/textile), and the separation of personality/content/behavior in [Memebot](https://github.com/ashleyotooligan/memebot). No source code from those repositories was copied. The habitat image was generated for this project. Bundled starter components retain their respective upstream notices.
