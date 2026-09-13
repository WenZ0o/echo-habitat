import type { Place, ResidentId } from "./types";
export const RESIDENT_IDS: ResidentId[] = ["moss", "lux", "echo"];
export const PROFILES = {
  moss: { name: "Moss", role: "The keeper", color: "#bdd599", letter: "M",
    description: "Patient hands. An instinct for growing things. Moss believes a place becomes a home when someone takes care of it.",
    traits: ["Nurturing", "Grounded", "Quietly brave"], goal: "Help the habitat flourish", home: "grove" as Place },
  lux: { name: "Lux", role: "The maker", color: "#e9b886", letter: "L",
    description: "Always taking something apart. Lux keeps the station running and is slowly learning that not everything needs fixing.",
    traits: ["Inventive", "Restless", "Dependable"], goal: "Keep a light on for everyone", home: "observatory" as Place },
  echo: { name: "Echo", role: "The seeker", color: "#b1bde7", letter: "E",
    description: "Drawn to patterns and unfinished stories. Echo collects small discoveries, convinced that this world has something to say.",
    traits: ["Curious", "Reflective", "Open-minded"], goal: "Understand what came before", home: "pool" as Place },
} as const;
export const PLACES: Record<Place, { name: string; x: number; y: number }> = {
  grove: { name: "The grove", x: 49, y: 43 }, pool: { name: "Reflection pool", x: 31, y: 57 },
  observatory: { name: "The observatory", x: 77, y: 47 },
};
export const EVENT_LABELS = { rain: "A little rain", relic: "An unknown object", blackout: "Lights out" } as const;
export function worldTime(tick: number) {
  const minutes = 480 + tick * 10;
  return { day: String(Math.floor(minutes / 1440) + 1).padStart(2, "0"),
    time: `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}` };
}
export function moodLabel(value: number) {
  return value >= 85 ? "Content" : value >= 65 ? "Curious" : value >= 45 ? "Thoughtful" : "Unsettled";
}
