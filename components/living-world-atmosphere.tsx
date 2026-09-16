import type { CSSProperties } from "react";
import { biome, noise } from "./island-terrain";

type AtmosphereProps = {
  district: number;
  latest: number;
  running: boolean;
  weather: string;
  power: number;
};

type DistrictLifeProps = {
  district: number;
  running?: boolean;
  compact?: boolean;
  completed?: number;
  power?: number;
};

const asStyle = (values: Record<string, string | number>) => values as CSSProperties;

export function LivingWorldAtmosphere({ district, latest, running, weather, power }: AtmosphereProps) {
  const b = biome(district);
  const horizonCount = Math.max(4, Math.min(8, latest + 3));
  const settlements = Array.from({ length: horizonCount }, (_, index) => {
    const seed = district * 97 + index * 23;
    return {
      x: 7 + index * (86 / Math.max(1, horizonCount - 1)) + (noise(seed) - .5) * 5,
      y: 33 + noise(seed + 3) * 17,
      scale: .52 + noise(seed + 7) * .52,
      delay: -(noise(seed + 11) * 8),
      towers: 2 + Math.floor(noise(seed + 17) * 4),
    };
  });

  const motes = Array.from({ length: 18 }, (_, index) => {
    const seed = district * 131 + index * 19;
    return {
      x: 4 + noise(seed) * 92,
      y: 10 + noise(seed + 4) * 72,
      size: 1 + noise(seed + 8) * 2.5,
      delay: -(noise(seed + 12) * 14),
      duration: 9 + noise(seed + 16) * 14,
    };
  });

  return <div
    className={`living-world-atmosphere${running ? " is-running" : ""}${weather === "rain" ? " is-rain" : ""}${power < 35 ? " is-low-power" : ""}`}
    style={asStyle({ "--world-accent": b.accent, "--world-water": b.water, "--world-warm": b.warm, "--world-glass": b.glass })}
    aria-hidden="true"
  >
    <span className="world-sky-glow"/>
    <span className="world-moon"/>
    <span className="world-cloud world-cloud-a"/>
    <span className="world-cloud world-cloud-b"/>
    <span className="world-cloud world-cloud-c"/>
    <span className="world-horizon-fog"/>

    <svg className="world-energy-skyway" viewBox="0 0 1000 560" preserveAspectRatio="none">
      <path className="world-skyway-shadow" d="M90 360 C250 270 375 300 502 348 S755 430 930 292"/>
      <path className="world-skyway-line" d="M90 360 C250 270 375 300 502 348 S755 430 930 292"/>
      <path className="world-skyway-line secondary" d="M165 420 C340 330 535 455 842 345"/>
    </svg>

    <div className="world-horizon-cities">
      {settlements.map((settlement, index) => <span
        key={index}
        className={`horizon-colony horizon-colony-${index % 3}`}
        style={asStyle({
          "--colony-x": `${settlement.x}%`,
          "--colony-y": `${settlement.y}%`,
          "--colony-scale": settlement.scale,
          "--colony-delay": `${settlement.delay}s`,
        })}
      >
        <i className="horizon-island-mass"/>
        <i className="horizon-dome"/>
        {Array.from({ length: settlement.towers }, (_, tower) => <i key={tower} className="horizon-tower" style={asStyle({ "--tower": tower })}/>) }
        <i className="horizon-beacon"/>
        <i className="horizon-reflection"/>
      </span>)}
    </div>

    <div className="world-motes">
      {motes.map((mote, index) => <i key={index} style={asStyle({
        "--mote-x": `${mote.x}%`,
        "--mote-y": `${mote.y}%`,
        "--mote-size": `${mote.size}px`,
        "--mote-delay": `${mote.delay}s`,
        "--mote-duration": `${mote.duration}s`,
      })}/>) }
    </div>

    <span className="world-ocean-glow"/>
    <span className="world-ocean-reflection world-ocean-reflection-a"/>
    <span className="world-ocean-reflection world-ocean-reflection-b"/>
    <span className="world-vignette"/>
  </div>;
}

export function DistrictLifeLayer({ district, running = true, compact = false, completed = 0, power = 100 }: DistrictLifeProps) {
  const b = biome(district);
  const lights = Array.from({ length: compact ? 8 : 15 }, (_, index) => {
    const seed = district * 211 + index * 29;
    return {
      x: 18 + noise(seed) * 64,
      y: 31 + noise(seed + 5) * 42,
      delay: -(noise(seed + 9) * 5),
      size: .7 + noise(seed + 13) * 1.3,
    };
  });
  const activity = Math.max(.3, Math.min(1, .32 + completed / 8));

  return <span
    className={`district-life-layer${compact ? " is-compact" : ""}${running ? " is-running" : ""}${power < 35 ? " is-low-power" : ""}`}
    style={asStyle({
      "--district-accent": b.accent,
      "--district-water": b.water,
      "--district-warm": b.warm,
      "--district-glass": b.glass,
      "--district-activity": activity,
    })}
    aria-hidden="true"
  >
    <svg className="district-network" viewBox="0 0 300 200" preserveAspectRatio="none">
      <path d="M70 116 Q105 92 143 107 T229 103"/>
      <path d="M96 128 Q119 108 151 109 T205 126"/>
      <path d="M151 108 Q153 84 151 60"/>
      <circle cx="151" cy="108" r="3.5"/>
      <circle cx="96" cy="128" r="2"/>
      <circle cx="229" cy="103" r="2"/>
    </svg>

    <span className="district-core">
      <i className="district-core-ring ring-a"/>
      <i className="district-core-ring ring-b"/>
      <i className="district-core-light"/>
    </span>

    <span className="district-satellite district-satellite-a"><i/><b/></span>
    <span className="district-satellite district-satellite-b"><i/><b/></span>
    {!compact && <span className="district-satellite district-satellite-c"><i/><b/></span>}

    <span className="district-light-field">
      {lights.map((light, index) => <i key={index} style={asStyle({
        "--light-x": `${light.x}%`,
        "--light-y": `${light.y}%`,
        "--light-delay": `${light.delay}s`,
        "--light-size": `${light.size}px`,
      })}/>) }
    </span>

    <span className="district-drone drone-a"><i/></span>
    {!compact && <span className="district-drone drone-b"><i/></span>}
    {!compact && <span className="district-drone drone-c"><i/></span>}
  </span>;
}
