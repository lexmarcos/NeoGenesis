import { useCallback, useRef, useState } from "react";

/**
 * The console event log: every status message the app produces (device checks,
 * profile loads, applies, errors) becomes a timestamped entry shown in the
 * status bar. Newest first, capped so long sessions stay cheap.
 */

export type EventKind = "info" | "success" | "error";

export interface LogEntry {
  id: number;
  kind: EventKind;
  message: string;
  time: Date;
}

const MAX_ENTRIES = 24;

export function useEventLog(initialMessage: string) {
  const nextId = useRef(1);
  const [entries, setEntries] = useState<LogEntry[]>(() => [
    { id: 0, kind: "info", message: initialMessage, time: new Date() }
  ]);

  const log = useCallback((message: string, kind: EventKind = "info") => {
    setEntries((current) => {
      const entry: LogEntry = { id: nextId.current++, kind, message, time: new Date() };
      return [entry, ...current].slice(0, MAX_ENTRIES);
    });
  }, []);

  return { entries, log, latest: entries[0] };
}

export const formatEventTime = (time: Date): string =>
  time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
