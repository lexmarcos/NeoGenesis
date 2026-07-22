import { Activity, Layers3, Sparkles, SunMedium, Waves } from "lucide-react";
import type { Effect } from "@/lib/types";

/** The single source of truth for effect presentation metadata. */
export const EFFECTS: { id: Effect; label: string; description: string; icon: typeof Waves }[] = [
  { id: "wave", label: "Onda RGB", description: "Varredura colorida", icon: Waves },
  { id: "stack", label: "Loading de cor", description: "Cores em camadas", icon: Layers3 },
  { id: "static", label: "Sólida", description: "Uma cor constante", icon: SunMedium },
  { id: "heartbeat", label: "Batimento", description: "Pulso duplo", icon: Activity },
  { id: "spectrum", label: "Ciclo de cores", description: "Espectro contínuo", icon: Sparkles }
];

export const EFFECT_LABELS: Record<Effect, string> = Object.fromEntries(
  EFFECTS.map((effect) => [effect.id, effect.label])
) as Record<Effect, string>;
