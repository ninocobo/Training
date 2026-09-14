import { SessionDoc } from '../models/session.model';

const STORAGE_KEY = 'rutina_sessions';

function readAll(): Record<string, SessionDoc> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, SessionDoc>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* almacenamiento no disponible: seguimos sin guardado local */
  }
}

export function localGetSession(id: string): SessionDoc | null {
  return readAll()[id] ?? null;
}

export function localSaveSession(id: string, data: SessionDoc): void {
  const all = readAll();
  all[id] = data;
  writeAll(all);
}

export function localGetPrevious(day: string, excludeId: string): SessionDoc | null {
  const all = readAll();
  const list = Object.entries(all)
    .filter(([id, doc]) => doc.day === day && id !== excludeId)
    .map(([, doc]) => doc)
    .sort((a, b) => b.date.localeCompare(a.date));
  return list[0] ?? null;
}
