# ECHO HABITAT

Three residents. Shared decisions. A world growing beyond its edges.

Version 0.4 adds moving illustrated residents, individually constructed buildings,
inspectable island districts, council votes with reasons, persistent elapsed-time
progress, and server-verified owner controls.

For the GitHub/Vercel update, start with [START-DE.md](START-DE.md)
or open README.txt in a text editor.

## Running on Vercel

Use Node 24.x and the included pnpm lockfile. Keep the existing private Vercel
Blob store connected with BLOB_READ_WRITE_TOKEN; world data stays at
echo-habitat/world.json. Existing save versions 1–3 are migrated without
clearing residents, memories or completed structures.

Configure two different random server secrets, each at least 32 characters:
HABITAT_OWNER_KEY for owner sign-in and CRON_SECRET for the daily scheduled job.
Neither value belongs in source control. Missing owner configuration fails closed:
visitors can read but cannot reset the world, change its clock or introduce events.

The signed owner cookie is HttpOnly, SameSite=Strict and Secure over HTTPS,
expires after seven days, and is invalidated by changing HABITAT_OWNER_KEY.
Vercel does not trust ChatGPT identity headers. The visitor URL is a display
restriction, not an authorization mechanism or a privacy setting.

## Development and verification

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

Local Next.js development also needs the private Blob token and owner secret
in an ignored .env.local. Do not use production storage for destructive tests.
The automated tests use in-memory SQLite and a mocked Blob transport; they
do not write to production.

## How the world works

The three residents follow authored, deterministic rules, not a language model.
They prioritize rest and emergencies, gather resources, vote on affordable
projects, build together and retain bounded personal histories.

A shared server clock runs at one cycle per 6.5 seconds at 1x. Viewers only poll;
more viewers do not accelerate the simulation. Manual commands use a separate
revision from automatic clock writes. Conditional storage writes prevent
concurrent updates from overwriting each other.

The server processes elapsed time on reads and on the authenticated daily
Vercel cron. Bounded requests retain unprocessed time and sub-cycle remainders.
There is no continuously running background process. Pausing stops progress
for everyone; time spent paused is not replayed. On migration, the new clock
starts at migration time rather than replaying old idle time at the faster rate.

The return summary uses each browser's last-seen marker, so another visitor
cannot consume it. At most 240 chronicle entries and 80 memories per resident
are retained; cumulative construction and decision counts continue to grow.

## Main files

- components/habitat.tsx: shared UI and non-overlapping polling.
- components/world-map.tsx: districts, construction stages and resident sprites.
- lib/habitat/engine.ts: decisions, migration and elapsed-time simulation.
- lib/habitat/access.ts: owner authorization and signed cookies.
- db/habitat.ts: synchronization and conditional updates.
- db/storage-driver.ts: private Vercel Blob adapter.
- app/api/habitat: world reads and owner-only commands.
- app/api/access: owner sign-in and sign-out.
- app/api/cron: authenticated scheduled synchronization.

The original Sites adapter files are retained for compatibility. Updating the
additional Sites-hosted preview is deferred; this release handoff targets Vercel.
The two hosts have separate storage and do not automatically share a world.

Illustrations are AI-generated and included under public/. No OpenAI API key
or paid model calls are required by the simulation. Hosting and storage usage
remain subject to your provider's limits and charges.

