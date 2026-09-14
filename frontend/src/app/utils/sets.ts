import { SetEntry } from '../models/session.model';

export function emptySets(count: number): SetEntry[] {
  return Array.from({ length: count }, () => ({ kg: null, reps: null }));
}

/** Devuelve una copia de `sets` con al menos `count` filas, sin mutar el original. */
export function ensureLength(sets: SetEntry[], count: number): SetEntry[] {
  if (sets.length >= count) return sets;
  return [...sets, ...emptySets(count - sets.length)];
}
