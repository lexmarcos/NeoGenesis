import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Cable, Check, ChevronRight, Eraser, Gauge, Keyboard, Layers3, LoaderCircle, Paintbrush, Palette, Play, RefreshCw, Save, Sparkles, SunMedium, TriangleAlert, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { KeyboardPreview } from "@/components/KeyboardPreview";
import { cn } from "@/lib/utils";
import { KEY_DECORATORS, keyIndexOf, planCustomApply, type KeyDecorator } from "@/lib/keymap";
import { createBusyLock } from "@/lib/busy";
import { cloneEffectConfigs, effectDefaults, type DeviceStatus, type Direction, type Effect, type LightingConfig, type Profile } from "@/lib/types";

const effects: { id: Effect; label: string; description: string; icon: typeof Waves }[] = [
  { id: "wave", label: "Onda RGB", description: "Varredura colorida", icon: Waves },
  { id: "stack", label: "Loading de cor", description: "Cores em camadas", icon: Layers3 },
  { id: "static", label: "Sólida", description: "Uma cor constante", icon: SunMedium },
  { id: "heartbeat", label: "Batimento", description: "Pulso duplo", icon: Activity },
  { id: "spectrum", label: "Ciclo de cores", description: "Espectro contínuo", icon: Sparkles },
];

const directions: { id: Direction; icon: typeof ArrowUp; label: string }[] = [
  { id: "up", icon: ArrowUp, label: "Cima" },
  { id: "left", icon: ArrowLeft, label: "Esquerda" },
  { id: "right", icon: ArrowRight, label: "Direita" },
  { id: "down", icon: ArrowDown, label: "Baixo" }
];

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
  // One device write at a time: the normal and per-key applies share this lock,
  // which flips synchronously and so also stops concurrent programmatic calls.
  const deviceLock = useRef(createBusyLock()).current;

  const selected = profiles.find((profile) => profile.id === activeProfile) ?? profiles[0];
  const config = effectConfigs[activeEffect];

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
  const visibleColors = config.effect === "static" ? 1 : config.effect === "heartbeat" ? 2 : config.effect === "spectrum" || config.effect === "wave" ? 0 : 5;
  const effectName = useMemo(() => effects.find((effect) => effect.id === config.effect)?.label ?? config.effect, [config.effect]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(255,20,74,.10),transparent_34%),radial-gradient(circle_at_20%_100%,rgba(103,38,255,.08),transparent_35%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-[1600px] grid-cols-[250px_1fr]">
        <aside className="border-r border-white/[0.07] bg-black/20 px-5 py-6 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/20"><Keyboard className="h-5 w-5" /></div>
            <div><div className="font-semibold tracking-tight">Neo Genesis</div><div className="text-xs text-muted-foreground">Controle do HyperX Mars</div></div>
          </div>

          <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Dispositivo</div>
          <Card className="mb-7 border-white/[0.08] bg-white/[0.025]">
            <CardContent className="p-3.5">
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 grid h-8 w-8 place-items-center rounded-lg", device.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500")}><Cable className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">HyperX Mars</div><div className="mt-1 font-mono text-[10px] text-zinc-500">0951 · 16C6</div></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <Badge variant={device.connected ? "success" : "warning"}>{device.connected ? "Conectado" : "Desconectado"}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void checkDevice()} disabled={checking}><RefreshCw className={cn("h-3.5 w-3.5", checking && "animate-spin")} /></Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-3 flex items-center justify-between px-2"><span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Perfis</span><span className="text-[10px] text-zinc-600">10 locais</span></div>
          <nav className="space-y-1">
            {profiles.map((profile) => (
              <button key={profile.id} onClick={() => selectProfile(profile)} className={cn("group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition", activeProfile === profile.id ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300")}>
                <span className={cn("grid h-6 w-6 place-items-center rounded-md border text-[10px]", activeProfile === profile.id ? "border-primary/50 bg-primary/15 text-primary" : "border-white/[0.08]")}>{String(profile.id).padStart(2, "0")}</span>
                <span className="flex-1 truncate">{profile.name}</span>
                {activeProfile === profile.id && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex h-[72px] items-center justify-between border-b border-white/[0.07] px-8">
            <div><h1 className="text-lg font-semibold">Iluminação</h1><p className="text-xs text-muted-foreground">{selected.name} · {effectName}</p></div>
            <div className="flex items-center gap-3"><span className="max-w-[360px] truncate text-xs text-zinc-500" title={message}>{message}</span><Button variant="outline" onClick={saveProfile}><Save className="mr-2 h-4 w-4" />Salvar</Button><Button className="min-w-36" onClick={() => void apply()} disabled={applying || applyingCustom || !device.connected} title={applyingCustom ? "Aguarde a gravação por tecla terminar" : undefined}>{applying ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}Aplicar no Mars</Button></div>
          </header>

          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_350px] gap-6 overflow-auto p-6 xl:p-8">
            <div className="min-w-0 space-y-6">
              <KeyboardPreview config={config} />
              <div>
                <div className="mb-3 flex items-center gap-2"><Palette className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Efeito de iluminação</h2></div>
                <div className="grid grid-cols-3 gap-3 2xl:grid-cols-5">
                  {effects.map((effect) => {
                    const Icon = effect.icon;
                    const active = effect.id === config.effect;
                    return <button key={effect.id} onClick={() => selectEffect(effect.id)} className={cn("relative rounded-xl border p-4 text-left transition", active ? "border-primary/55 bg-primary/[0.08] shadow-[0_0_25px_rgba(255,20,74,.07)]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]")}><Icon className={cn("mb-5 h-5 w-5", active ? "text-primary" : "text-zinc-500")} /><div className="text-sm font-medium">{effect.label}</div><div className="mt-1 text-[11px] text-zinc-600">{effect.description}</div>{active && <span className="absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full bg-primary"><Check className="h-2.5 w-2.5" /></span>}</button>;
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2"><Paintbrush className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold">Personalizado por tecla</h2></div>
                <Card className="border-white/[0.08] bg-white/[0.025]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <CardDescription>Clique nas teclas para pintar com a cor escolhida; clique de novo para limpar. Teclas sem cor ficam apagadas.</CardDescription>
                      <div className="flex shrink-0 items-center gap-2">
                        <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ backgroundColor: customPaint }} title="Cor do pincel">
                          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={customPaint} onChange={(event) => setCustomPaint(event.target.value)} />
                        </label>
                        <Button variant="outline" size="sm" onClick={() => { setCustomColors({}); setCustomError(null); }} disabled={paintedCount === 0}><Eraser className="mr-2 h-3.5 w-3.5" />Limpar</Button>
                        <Button size="sm" className="min-w-32" onClick={() => void applyCustom()} disabled={applying || applyingCustom || !device.connected || paintedCount === 0} title={applying ? "Aguarde a gravação em andamento terminar" : paintedCount === 0 ? "Pinte ao menos uma tecla para aplicar" : undefined}>{applyingCustom ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-2 h-3.5 w-3.5 fill-current" />}Aplicar por tecla</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CustomKeyboard colors={customColors} onKeyClick={paintKey} />
                    <div className="mt-3 text-[10px] text-zinc-600">{paintedCount === 0 ? "Nenhuma tecla pintada — pinte ao menos uma posição para habilitar a aplicação." : `${paintedCount} de 119 posições pintadas.`}</div>
                    {customError && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.07] p-3">
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <p className="select-text whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-red-200">{customError}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-5">
              <Card className="border-white/[0.08] bg-white/[0.025]">
                <CardHeader className="pb-4"><CardTitle className="text-sm">Cores</CardTitle><CardDescription>Paleta gravada na memória do teclado.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {visibleColors === 0 ? <div className="rounded-lg border border-white/[0.07] bg-gradient-to-r from-red-500 via-green-400 to-blue-500 p-[1px]"><div className="rounded-[7px] bg-zinc-950/90 px-3 py-4 text-center text-xs text-zinc-400">Paleta RGB gerada pelo firmware</div></div> : <div className="grid grid-cols-5 gap-2">{config.colors.slice(0, visibleColors).map((color, index) => <label key={index} className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10" style={{ backgroundColor: color, boxShadow: `inset 0 -10px 22px rgba(0,0,0,.22)` }}><input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={color} onChange={(event) => { const next = [...config.colors]; next[index] = event.target.value; update("colors", next); }} /><span className="absolute inset-x-1 bottom-1 truncate text-center font-mono text-[7px] uppercase text-white/75">{color.slice(1)}</span></label>)}</div>}
                </CardContent>
              </Card>

              <Card className="border-white/[0.08] bg-white/[0.025]">
                <CardHeader className="pb-5"><CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4 text-primary" />Ajustes</CardTitle></CardHeader>
                <CardContent className="space-y-7">
                  <div><div className="mb-3 flex justify-between text-xs"><span className="text-zinc-400">Brilho</span><span className="font-mono text-zinc-500">{config.brightness}/5</span></div><Slider min={1} max={5} step={1} value={[config.brightness]} onValueChange={([value]) => update("brightness", value)} /></div>
                  {config.effect !== "static" && <div><div className="mb-3 flex justify-between text-xs"><span className="text-zinc-400">Velocidade</span><span className="font-mono text-zinc-500">{config.speed}/5</span></div><Slider min={1} max={5} step={1} value={[config.speed]} onValueChange={([value]) => update("speed", value)} /></div>}
                  {(config.effect === "wave" || config.effect === "stack") && <div><div className="mb-3 text-xs text-zinc-400">Direção</div><div className="grid grid-cols-4 gap-2">{directions.map(({ id, icon: Icon, label }) => <button key={id} title={label} onClick={() => update("direction", id)} className={cn("grid h-9 place-items-center rounded-md border transition", config.direction === id ? "border-primary/50 bg-primary/10 text-primary" : "border-white/[0.08] text-zinc-500 hover:text-zinc-300")}><Icon className="h-4 w-4" /></button>)}</div></div>}
                  {(config.effect === "heartbeat" || config.effect === "stack") && <div className="flex items-center justify-between border-t border-white/[0.06] pt-5"><div><div className="text-xs font-medium">Repetição contínua</div><div className="mt-1 text-[10px] text-zinc-600">Mantém o efeito em loop</div></div><Switch checked={config.loopMode} onCheckedChange={(value) => update("loopMode", value)} /></div>}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
