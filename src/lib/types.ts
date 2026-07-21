export type Effect = "heartbeat" | "wave" | "stack" | "static" | "spectrum";
export type Direction = "up" | "left" | "right" | "down";

export interface LightingConfig {
  effect: Effect;
  colors: string[];
  brightness: number;
  speed: number;
  direction: Direction;
  loopMode: boolean;
}

export interface DeviceStatus {
  connected: boolean;
  name: string;
  vendorId: number;
  productId: number;
  firmware?: string;
  usagePage?: number;
  interfaceNumber?: number;
  error?: string;
}

export interface Profile {
  id: number;
  name: string;
  activeEffect: Effect;
  effects: Record<Effect, LightingConfig>;
}

const rgb = ["#ff0000", "#ff00ff", "#00ff00", "#ffff00", "#0000ff"];

export const effectDefaults: Record<Effect, LightingConfig> = {
  wave: { effect: "wave", colors: [...rgb], brightness: 5, speed: 3, direction: "right", loopMode: true },
  stack: { effect: "stack", colors: [...rgb], brightness: 5, speed: 3, direction: "left", loopMode: true },
  static: { effect: "static", colors: ["#ff0000", ...rgb.slice(1)], brightness: 5, speed: 3, direction: "up", loopMode: false },
  heartbeat: { effect: "heartbeat", colors: ["#ff164d", "#ff7a00", "#000000", "#000000", "#000000"], brightness: 5, speed: 5, direction: "up", loopMode: true },
  spectrum: { effect: "spectrum", colors: [...rgb], brightness: 5, speed: 3, direction: "up", loopMode: true }
};

export const cloneEffectConfigs = (source: Partial<Record<Effect, LightingConfig>> = {}): Record<Effect, LightingConfig> =>
  Object.fromEntries((Object.keys(effectDefaults) as Effect[]).map((effect) => {
    const config = source[effect] ?? effectDefaults[effect];
    return [effect, { ...effectDefaults[effect], ...config, effect, colors: [...config.colors] }];
  })) as Record<Effect, LightingConfig>;

export const defaultConfig: LightingConfig = effectDefaults.wave;
