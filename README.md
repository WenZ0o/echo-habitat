# ECHO HABITAT

A small world, unfolding. Three digital residents share a greenhouse habitat, make decisions, remember encounters, and build their world together.

![The habitat](public/habitat.png)

## What you can do

- Observe **Moss**, the keeper; **Lux**, the maker; and **Echo**, the seeker.
- Select residents on the map or in their cards to inspect thoughts, energy, wellbeing, memories and connections.
- Watch the residents physically move between the grove, pool, observatory, meeting points and active construction sites.
- See Moss, Lux and Echo hold a shared council before a project starts, including each resident's vote and the group's chosen priority.
- Follow visible construction phases, individual contributions, completed structures and newly revealed island fragments. Each bridge opens the next district automatically.
- Introduce rain, an unknown object, or a power interruption. Each has distinct consequences and lasts four simulation steps.
- Pause, advance by one step, or change playback speed to 1×, 2× or 4×.
- Revisit the chronicle and resume the same saved world after reloading. Time spent away is converted into bounded catch-up cycles when the habitat is opened again.
- Copy a `?mode=visitor` link that hides all state-changing controls and refreshes the shared world in read-only mode.
- Start over through a confirmation dialog.

**This is a rule-driven life simulation with authored dialogue. It does not call an LLM, train a model, or represent conscious beings.** Three generated map illustrations show the original habitat and its first major expansions. Additional districts are represented by live island fragments, construction markers and the district trail rather than an infinite procedurally rendered map. No model API key is required.

While the owner page is open, playback advances the shared habitat normally. There is no always-running background worker; instead, the server stores a real-time activity marker and performs a bounded catch-up when the habitat is requested after time away. Multiple tabs share the same habitat; optimistic revision checks prevent a stale tab from overwriting a newer state. A reset clears this shared world's history.

## Stack and layout

React + TypeScript on standard Next.js 16, deployed on Vercel. The shared habitat state is stored as a private Vercel Blob with ETag-based optimistic concurrency. Matching accessible controls use the bundled Shadcn/Radix primitives.

| Path | Responsibility |
| --- | --- |
| `components/habitat.tsx` | Interactive map, resident movement, offline-return summary, visitor mode, chronicle, playback and event controls |
| `components/construction-board.tsx` | Resource stores, council votes, phased building progress, construction sites, island expansion and district trail |
| `app/globals.css` | Responsive visual design and reduced-motion behavior |
| `lib/habitat/types.ts` | Shared world, resident, event and memory types |
| `lib/habitat/residents.ts` | Resident personalities, goals and map locations |
| `lib/habitat/engine.ts` | Pure, seeded simulation transitions |
| `lib/habitat/construction.ts` | Building plans, costs, work requirements, resources and district progression |
| `app/api/habitat/route.ts` | Validated HTTP API and same-origin checks |
| `db/habitat.ts` | Private Vercel Blob persistence and ETag-based optimistic concurrency |
| `vercel.json` | Vercel install/build configuration |
| `scripts/check-habitat.mjs` | Engine and API/storage tests using real local SQLite |

The decision order is: recover low energy, address role-specific emergencies, react to an active event, gather or build, interact with a nearby resident, explore, then pursue the resident's own purpose. Every fourth cycle leaves space for encounters, exploration and maintenance. Selected discovery memories can be shared during encounters. Bonds change through interaction and affect the resident's dialogue. New memories and chronicle entries are saved with the resulting state.

## Autonomous world building

Moss gathers **biomass**, Lux recovers **salvage**, and Echo gains **insight**. When one or more plans are affordable, the three hold a council and vote on the next priority. The bridge remains the final project of each district so expansion still has a clear rhythm. Materials are deducted exactly once after the decision. The project then moves through foundation, frame and finishing phases; its lead contributes two work units per building action and the others contribute one. Construction survives rest, interventions, reloads and offline catch-up. Completion creates permanent benefits, shared memories and stronger bonds between contributors.

| Plan | Lead | Permanent effect |
| --- | --- | --- |
| Living garden | Moss | +1 growth per cycle per garden, up to +2 |
| Sun terrace | Lux | +1 power per cycle per terrace, up to +3 |
| Lookout | Echo | +1 insight per gathering action per lookout, up to +3 |
| Rain collector | Moss | +1 biomass per gathering action per collector, up to +3 |
| Shared workshop | Lux | +1 salvage per gathering action per workshop, up to +3 |
| Bridge outward | Echo | Opens the next district and repeats the plan sequence |

Each district repeats these six plans. Costs and work rise for later districts, then plateau so the settlement can keep expanding. Stores are capped at 250 of each resource; structure counts remain cumulative without an ever-growing building array. Rain provides extra biomass and relic study provides extra insight. Rest and emergency repairs still take priority.

Version 1 and version 2 saved worlds are upgraded in memory to world format **v3** without resetting the clock, memories, relationships or chronicle. New resident map positions, council state and the real-time activity marker are written on the next successful action. The deployed SQL migration does not change.

Retention is bounded to the most recent **80 memories per resident** and **240 chronicle entries**. Offline catch-up is capped at **96 cycles** per return so a long absence cannot create an unbounded request. The total-memory counter remains cumulative.

The visitor URL is an interface-level read-only mode intended for sharing the project with a friend: it never sends simulation actions and hides reset/event/playback controls. It is **not an authentication boundary**; add application-level identity or an owner secret before using the deployment as an adversarial public multi-user service.

## Run locally

Use Node.js **24** and pnpm **11.25.0**. Install dependencies with `pnpm install --no-frozen-lockfile`, then run `pnpm dev`. The production persistence layer uses a private Vercel Blob store, so local API persistence requires Vercel environment credentials; the pure simulation tests need no network or production storage.

## Deploy on Vercel

1. Import the GitHub repository into Vercel. The included `vercel.json` forces the standard Next.js build instead of the old Vinext/Cloudflare build.
2. After the first deployment, open **Storage** in the Vercel project, choose **Create Database → Blob**, select **Private**, create the store, and connect it to this project. Vercel supplies the required Blob credentials/OIDC automatically.
3. Redeploy the project once after connecting the store.
4. Share the normal production URL with `?mode=visitor` appended for the read-only visitor interface.

## Verify

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

The test suite covers distinct event outcomes and expiry, deterministic save/resume, 600-step bounds, unique chronicle keys, immutable transitions, resident movement bounds, shared council decisions, one-time material reservation, collaborative construction, repeated district expansion, permanent building benefits, offline catch-up limits, emergency/rest priorities, legacy save upgrades, persistence, concurrent and stale revisions, invalid input, cross-site writes, event overlap, and reset. It substitutes only the Vercel Blob SDK with an in-memory conditional-write store, so tests do not touch production storage.

WebMCP tools (`read_habitat`, `introduce_habitat_event`) are registered only if the browser provides `document.modelContext`. They use the same state/actions as the interface. Their live browser integration has not been verified in this environment and is optional to the application.

## API

- `GET /api/habitat` returns `{ world, revision }`, initializes a fresh world if needed, and can include an `offline` catch-up summary. `?mode=visitor` marks the response as visitor mode.
- `POST /api/habitat` accepts `{ revision, action }` with `action` equal to `{ type: "step" }`, `{ type: "event", event: "rain" | "relic" | "blackout" }`, or `{ type: "reset" }`.
- `409` returns the latest state after a revision conflict; the client pauses and reloads that state.
- `422` rejects an event while another is active. Failed storage operations return `503`; the client pauses and exposes a recovery action.

## GitHub

This source includes a README, a German quickstart, a lockfile and a verification workflow. Extract the source ZIP and upload the contents to a new GitHub repository, with `package.json` at its root. GitHub's browser upload accepts up to 100 files per batch: upload `components/` first, commit, then upload the remaining files and folders at the repository root and commit again. The ZIP itself is not the repository source layout. GitHub upload alone does not deploy the shared-state app. Import the repository into Vercel and connect a private Blob store as described above.

Official guides: [Create a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository), [upload files and limits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).

See [START-DE.md](START-DE.md) for the short German guide.

## Inspiration and artwork

Conceptual inspiration: [Cantrip](https://github.com/deepfates/cantrip), [Textile](https://github.com/deepfates/textile), and the separation of personality/content/behavior in [Memebot](https://github.com/ashleyotooligan/memebot). No source code from those repositories was copied. The habitat image was generated for this project. Bundled starter components retain their respective upstream notices.
