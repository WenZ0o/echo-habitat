# ECHO HABITAT
### Three lives. One shared world. A story that keeps growing.

![ECHO HABITAT — application preview](public/preview.png)

https://github.com/user-attachments/assets/184496da-bf1b-4505-ad4a-e3d22fe10dc9

[Explore the live habitat →](https://echo-habitat-1l97.vercel.app/?mode=visitor)

ECHO HABITAT is a persistent life simulation about three digital residents building a world together.

Watch Moss, Lux and Echo gather resources, choose their next project, help each other through unexpected events, and expand from their first habitat into a living archipelago.

You don't place every building. You observe the world they create.

## Meet the residents

![Moss, Lux and Echo — character artwork](public/world-residents.png)

🌱 **Moss — The caretaker**  
Collects seeds and fibres, tends the habitat, and helps new life take root.

☀️ **Lux — The builder**  
Recovers useful parts, maintains the power, and turns shared ideas into working structures.

✨ **Echo — The explorer**  
Maps unfamiliar ground, studies discoveries, and looks beyond the edge of the known world.

Each resident has their own energy, wellbeing, thoughts, memories and relationships.

## The Living Archipelago

Origin is the first home and the visual and geographic heart of ECHO HABITAT.

Every completed bridge reveals another district in the same world. The outer districts use the same high-resolution environment and structure artwork as Origin instead of a separate vector illustration style. Moss-covered rock, natural paths, glass-and-metal habitat architecture and warm inhabited lighting remain consistent across the whole world.

The atlas grows radially around Origin. Nearby districts form the first world ring; later districts occupy wider rings around the center. Routes connect new settlements back toward the nearest established inner ring, so the world reads as an expanding archipelago rather than a horizontal sequence.

The atlas can be dragged, zoomed and explored. Select a district to focus it, inspect its settlement progress and enter its live view.

Districts remain distinct through authored city kits rather than incompatible art styles. Each district has its own:

- settlement identity and locally named structures
- dominant structure types and realistic supporting clusters
- building mix, scale, rotation and visual hierarchy
- landmark and compact atlas identity
- environmental and narrative character

The underlying simulation roles stay consistent so the world remains mechanically coherent, while the visible settlement composition changes strongly from district to district.

## Watch a world take shape

- **Moving residents:** follow Moss, Lux and Echo through Origin and the outer districts.
- **Shared decisions:** see council votes and the reasons behind them.
- **Visible construction:** structures progress through foundation, frame and finishing stages.
- **Distinct city kits:** Grove City, Sunworks, Water Quarter, Archive City, Basalt Works, Terrace Commune, Glass Ridge, Wind Gardens, Flooded Sanctuary and Ember Enclave emphasize different realistic structures and settlement density.
- **Growing world rings:** completed bridges reveal new islands around Origin without replacing the world already built.
- **Interactive atlas:** drag, zoom, focus districts, fit the full world or follow the active frontier.
- **Personal memories:** residents remember discoveries, encounters and what they build together.
- **A shared chronicle:** browse the latest moments in the world's story.

## Give the world a gentle nudge

Introduce rain, leave an unfamiliar relic, or interrupt the power.

Moss, Lux and Echo respond according to their needs and priorities. Rest and emergencies can take precedence over construction.

Then watch what happens next.

## A world you can return to

Progress is saved in a shared world.

When you return, the simulation processes elapsed time and shows what changed since your last visit. A configured daily background job also synchronizes the world while nobody is watching.

Pausing the shared clock stops progress for everyone.

## Observe or take control

Visitors can explore the atlas, inspect districts and residents, and read their memories.

The signed-in owner can control the clock, introduce events and start a new world. These permissions are checked on the server.

Visitor mode does not change the website's privacy settings.

## How it works

The residents use authored, deterministic simulation rules. Their dialogue and decisions do not come from a language model.

**No AI API key is required to run the simulation.**

Built with Next.js, React and TypeScript. The Vercel version stores its world in private Vercel Blob storage.

The project artwork establishes one visual language for Origin and every expanding district.

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

## Project status

Version 0.7 — Radial world and distinct city-kit pass.

Moving residents · Council decisions · Construction phases  
Photoreal district art · Origin-centered radial atlas · Distinct city kits · Persistent memories · Protected owner controls

---

*A small world, still becoming.*