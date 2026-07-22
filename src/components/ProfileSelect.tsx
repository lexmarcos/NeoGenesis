import { Select, SelectCheck, SelectContent, SelectItem, SelectItemText, SelectTrigger } from "@/components/ui/select";
import { EFFECTS } from "@/components/effects/effects";
import { cn } from "@/lib/utils";
import type { Effect, Profile } from "@/lib/types";

const EFFECT_ICONS = Object.fromEntries(EFFECTS.map((effect) => [effect.id, effect.icon])) as Record<Effect, (typeof EFFECTS)[number]["icon"]>;

interface ProfileSelectProps {
  profiles: Profile[];
  activeProfile: number;
  /** True when the active profile has unsaved edits. */
  activeDirty: boolean;
  onSelectProfile: (profile: Profile) => void;
}

/** The slot indicator: the profile's number in the keyboard's own memory. */
function Slot({ id, active }: { id: number; active: boolean }) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-md border font-mono text-[10px]",
        active ? "border-primary/50 bg-primary/15 text-primary" : "border-white/[0.08] text-zinc-500"
      )}
    >
      {String(id).padStart(2, "0")}
    </span>
  );
}

export function ProfileSelect({ profiles, activeProfile, activeDirty, onSelectProfile }: ProfileSelectProps) {
  const selected = profiles.find((profile) => profile.id === activeProfile) ?? profiles[0];

  return (
    <Select
      value={String(activeProfile)}
      onValueChange={(value) => {
        const profile = profiles.find((item) => item.id === Number(value));
        if (profile) onSelectProfile(profile);
      }}
    >
      <SelectTrigger className="h-9 w-[190px] gap-2 px-2" aria-label="Perfil">
        <Slot id={selected.id} active />
        <span className="min-w-0 truncate text-[13px] font-medium text-zinc-100">{selected.name}</span>
        {activeDirty && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]"
            title="Alterações não salvas"
          />
        )}
      </SelectTrigger>

      <SelectContent className="w-[190px]">
        {profiles.map((profile) => {
          const EffectIcon = EFFECT_ICONS[profile.activeEffect];
          const active = profile.id === activeProfile;
          return (
            <SelectItem key={profile.id} value={String(profile.id)} className="gap-2">
              <Slot id={profile.id} active={active} />
              <span className="min-w-0 flex-1 truncate text-[13px]">
                <SelectItemText>{profile.name}</SelectItemText>
              </span>
              <EffectIcon className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
              {active && activeDirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
              <SelectCheck />
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
