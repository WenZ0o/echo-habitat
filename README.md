# ECHO HABITAT
![ECHO HABITAT – Projektvorschau](public/habitat.png)

# ECHO HABITAT
### Three lives. One shared world. A story that keeps growing.

![Echo Habitat — world artwork](public/habitat.png)

ECHO HABITAT is a small life simulation about three digital residents
building a home together.

Watch Moss, Lux and Echo gather resources, choose their next project,
help each other through unexpected events, and turn empty ground
into a growing settlement.

You don't place every building. You observe the world they create.

## Meet the residents

![Moss, Lux and Echo — character artwork](public/world-residents.png)

🌱 **Moss — The caretaker**  
Collects seeds and fibres, tends the grove, and helps the habitat grow.

☀️ **Lux — The builder**  
Recovers useful parts, maintains the power, and turns shared ideas
into working structures.

✨ **Echo — The explorer**  
Maps unfamiliar ground, studies discoveries, and looks beyond
the edge of the island.

Each resident has their own energy, wellbeing, thoughts,
memories and relationships.

## Watch a world take shape

- **Moving residents:** follow them between home, meetings and construction.
- **Shared decisions:** see their council votes and the reasons behind them.
- **Visible construction:** buildings progress through foundation,
  frame and finishing stages.
- **Growing districts:** completed bridges open new ground to develop.
- **Personal memories:** residents remember discoveries, encounters
  and the things they build together.
- **A shared chronicle:** browse the latest moments in the world's story.

## Give the world a gentle nudge

Introduce rain, leave an unfamiliar relic, or interrupt the power.

Moss, Lux and Echo respond according to their needs and priorities.
Rest and emergencies can take precedence over construction.

Then watch what happens next.

## A world you can return to

Progress is saved in a shared world.

When you return, the simulation processes elapsed time and shows
what changed since your last visit. A configured daily background
job also synchronizes the world while nobody is watching.

Pausing the shared clock stops progress for everyone.

## Observe or take control

Visitors can explore the map, inspect residents and read their memories.

The signed-in owner can control the clock, introduce events
and start a new world. These permissions are checked on the server.

Visitor mode does not change the website's privacy settings.

## How it works

The residents use authored, deterministic simulation rules.
Their dialogue and decisions do not come from a language model.

**No AI API key is required to run the simulation.**

Built with Next.js, React and TypeScript.
The Vercel version stores its world in private Vercel Blob storage.

The images above are project artwork, not screenshots of the interface.

## Run the project

Requires Node.js 24.x and pnpm.

    pnpm install --frozen-lockfile
    pnpm dev

Configure these environment variables locally or in Vercel:

| Variable | Purpose |
| --- | --- |
| BLOB_READ_WRITE_TOKEN | Access to the private world storage |
| HABITAT_OWNER_KEY | Private key for owner sign-in |
| CRON_SECRET | Protects the scheduled background endpoint |

Use different random values of at least 32 characters for
HABITAT_OWNER_KEY and CRON_SECRET.

Never commit real keys or .env files to GitHub.

## Project status

Version 0.4 — an evolving experiment in shared world-building.

Moving residents · Council decisions · Construction phases
Growing districts · Persistent memories · Protected owner controls

---

*A small world, still becoming.*

