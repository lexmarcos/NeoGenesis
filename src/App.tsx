import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Grid3x3, Waves } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/Sidebar";
import { AnimationTab } from "@/components/AnimationTab";
import { PerKeyTab } from "@/components/PerKeyTab";
import { KEY_DECORATORS, keyIndexOf, planCustomApply, type KeyDecorator } from "@/lib/keymap";
import { createBusyLock } from "@/lib/busy";
import { cloneEffectConfigs, effectDefaults, type DeviceStatus, type Effect, type LightingConfig, type Profile } from "@/lib/types";

const makeProfiles = (): Profile[] => Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  name: `Perfil ${String(index + 1).padStart(2, "0")}`,
  activeEffect: "wave",
  effects: cloneEffectConfigs()
}));

type LegacyEffect = Effect | "reactive" | "aurora" | "breathing";
type StoredProfile = Partial<Profile> & { config?: Omit<LightingConfig, "effect"> & { effect: LegacyEffect } };

const migrateEffect = (effect?: LegacyEffect): Effect =>
  effect === "reactive" || effect === "aurora" || effect === "breathing" ? "heartbeat" : effect ?? "wave";

function migrateProfile(stored: StoredProfile, index: number): Profile {
  const effects = cloneEffectConfigs();
  if (stored.effects) {
    for (const [key, value] of Object.entries(stored.effects)) {
      if (!value) continue;
      const effect = migrateEffect(key as LegacyEffect);
      effects[effect] = { ...effectDefaults[effect], ...value, effect, colors: [...value.colors] };
    }
  }
  if (stored.config) {
    const effect = migrateEffect(stored.config.effect);
    effects[effect] = { ...effectDefaults[effect], ...stored.config, effect, colors: [...stored.config.colors] };
  }
  return {
    id: stored.id ?? index + 1,
    name: stored.name ?? `Perfil ${String(index + 1).padStart(2, "0")}`,
    activeEffect: migrateEffect(stored.activeEffect as LegacyEffect | undefined ?? stored.config?.effect),
    effects
  };
}

function loadProfiles(): Profile[] {
  try {
    const saved = localStorage.getItem("mars-control.profiles");
    if (!saved) return makeProfiles();
    const parsed = JSON.parse(saved) as StoredProfile[];
    return parsed.map(migrateProfile);
  } catch {
    return makeProfiles();
  }
}

function loadCustomColors(): Record<number, string> {
  try {
    const saved = localStorage.getItem("mars-control.customColors");
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Record<string, string>;
    const valid = new Set(KEY_DECORATORS.map(keyIndexOf));
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key, color]) => valid.has(Number(key)) && /^#[0-9a-f]{6}$/i.test(color))
        .map(([key, color]) => [Number(key), color])
    );
  } catch {
    return {};
  }
}

const disconnected: DeviceStatus = { connected: false, name: "HyperX Mars", vendorId: 0x0951, productId: 0x16c6 };

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [activeProfile, setActiveProfile] = useState(1);
  const [activeEffect, setActiveEffect] = useState<Effect>(profiles[0].activeEffect);
  const [effectConfigs, setEffectConfigs] = useState<Record<Effect, LightingConfig>>(() => cloneEffectConfigs(profiles[0].effects));
  const [device, setDevice] = useState<DeviceStatus>(disconnected);
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("Pronto para configurar");
  const [customColors, setCustomColors] = useState<Record<number, string>>(loadCustomColors);
  const [customPaint, setCustomPaint] = useState("#ff164d");
  const [applyingCustom, setApplyingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [tab, setTab] = useState<"animacao" | "porTecla">("animacao");
  // One device write at a time: the normal and per-key applies share this lock,
  // which flips synchronously and so also stops concurrent programmatic calls.
  const deviceLock = useRef(createBusyLock()).current;

  const selected = profiles.find((profile) => profile.id === activeProfile) ?? profiles[0];
  const config = effectConfigs[activeEffect];
  const busy = applying || applyingCustom;

  const checkDevice = useCallback(async () => {
    setChecking(true);
    try {
      const status = await invoke<DeviceStatus>("get_device_status");
      setDevice(status);
      setMessage(status.connected ? "Teclado conectado" : status.error ?? "Teclado não encontrado");
    } catch (error) {
      setDevice({ ...disconnected, error: String(error) });
      setMessage(String(error));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void checkDevice(); }, [checkDevice]);
  useEffect(() => { localStorage.setItem("mars-control.profiles", JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => { localStorage.setItem("mars-control.customColors", JSON.stringify(customColors)); }, [customColors]);

  const update = <K extends keyof LightingConfig>(key: K, value: LightingConfig[K]) => setEffectConfigs((current) => ({
    ...current,
    [activeEffect]: { ...current[activeEffect], [key]: value }
  }));
  const selectEffect = (effect: Effect) => setActiveEffect(effect);
  const selectProfile = (profile: Profile) => {
    setActiveProfile(profile.id);
    setActiveEffect(profile.activeEffect);
    setEffectConfigs(cloneEffectConfigs(profile.effects));
    setMessage(`${profile.name} carregado`);
  };

  const saveProfile = () => {
    setProfiles((current) => current.map((profile) => profile.id === activeProfile ? {
      ...profile,
      activeEffect,
      effects: cloneEffectConfigs(effectConfigs)
    } : profile));
    setMessage(`${selected.name} salvo neste computador`);
  };

  const apply = async () => {
    if (!deviceLock.acquire()) {
      setMessage("Já existe uma gravação em andamento");
      return;
    }
    setApplying(true);
    setMessage("Gravando perfil no teclado…");
    try {
      await invoke("apply_lighting", { config, effectConfigs: Object.values(effectConfigs) });
      saveProfile();
      setMessage("Perfil aplicado com sucesso");
    } catch (error) {
      setMessage(`Falha ao aplicar: ${String(error)}`);
    } finally {
      setApplying(false);
      deviceLock.release();
    }
  };

  const paintKey = (key: KeyDecorator) => {
    const keyIndex = keyIndexOf(key);
    setCustomError(null);
    setCustomColors((current) => {
      const next = { ...current };
      if (next[keyIndex] === customPaint) delete next[keyIndex];
      else next[keyIndex] = customPaint;
      return next;
    });
  };

  const applyCustom = async () => {
    // planCustomApply refuses an empty selection: the backend would accept it
    // and darken every key. The button is disabled in that state too.
    const plan = planCustomApply(customColors);
    if (!plan.ok) {
      setCustomError("Nenhuma tecla pintada. Pinte ao menos uma posição antes de aplicar — enviar uma seleção vazia apagaria todas as teclas do teclado.");
      setMessage("Aplicação por tecla bloqueada: seleção vazia");
      return;
    }
    if (!deviceLock.acquire()) {
      setCustomError("Já existe uma gravação em andamento. Aguarde a anterior terminar antes de aplicar por tecla.");
      return;
    }
    setApplyingCustom(true);
    setCustomError(null);
    setMessage("Gravando perfil por tecla no teclado…");
    try {
      // Payload shape mirrors CustomKeyColor (serde camelCase): the backend
      // build_custom_transaction() remains the validation authority.
      await invoke("apply_custom_lighting", { keys: plan.keys });
      setMessage(`Perfil por tecla aplicado (${plan.keys.length} posições)`);
    } catch (error) {
      // Backend errors name the failing step and the payload byte; show them
      // whole instead of truncating into the status line.
      setCustomError(error instanceof Error ? error.message : String(error));
      setMessage("Falha ao aplicar por tecla");
    } finally {
      setApplyingCustom(false);
      deviceLock.release();
    }
  };

  const paintedCount = Object.keys(customColors).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_-4%,hsl(var(--primary)/.12),transparent_36%),radial-gradient(circle_at_16%_104%,rgba(103,38,255,.10),transparent_38%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1600px] grid-cols-[264px_1fr]">
        <Sidebar
          device={device}
          checking={checking}
          onRefresh={() => void checkDevice()}
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={selectProfile}
        />

        <section className="flex min-w-0 flex-col">
          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="flex min-h-screen flex-col">
            <header className="flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] px-8">
              <TabsList>
                <TabsTrigger value="animacao"><Waves className="h-4 w-4" />Animação</TabsTrigger>
                <TabsTrigger value="porTecla"><Grid3x3 className="h-4 w-4" />Por tecla</TabsTrigger>
              </TabsList>
              <div className="flex min-w-0 items-center gap-3">
                <span className="hidden truncate text-xs text-zinc-500 md:inline" title={message}>{message}</span>
                <span className="font-mono text-[11px] text-zinc-600">{selected.name}</span>
              </div>
            </header>

            <div className="flex-1 overflow-auto p-6 xl:p-8">
              <div className="mx-auto max-w-[1180px]">
                <TabsContent value="animacao">
                  <AnimationTab
                    config={config}
                    onSelectEffect={selectEffect}
                    onUpdate={update}
                    onSave={saveProfile}
                    onApply={() => void apply()}
                    applying={applying}
                    busy={busy}
                    connected={device.connected}
                  />
                </TabsContent>
                <TabsContent value="porTecla">
                  <PerKeyTab
                    colors={customColors}
                    brush={customPaint}
                    onBrush={(color) => { setCustomPaint(color); setCustomError(null); }}
                    onKeyClick={paintKey}
                    onClear={() => { setCustomColors({}); setCustomError(null); }}
                    onApply={() => void applyCustom()}
                    applyingCustom={applyingCustom}
                    busy={busy}
                    connected={device.connected}
                    paintedCount={paintedCount}
                    error={customError}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
