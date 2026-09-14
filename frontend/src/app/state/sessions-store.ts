import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getDay } from '../data/routine';
import { DaySpec, SaveStatus, SessionDoc } from '../models/session.model';
import { SessionsService } from '../services/sessions.service';
import { defaultDayForToday, sessionId, todayISO } from '../utils/format';
import {
  localGetActiveDay,
  localGetPrevious,
  localGetSession,
  localSaveActiveDay,
  localSaveSession,
} from '../utils/local-cache';
import { ensureLength } from '../utils/sets';

function emptySession(dayId: string, dateISO: string): SessionDoc {
  return { day: dayId, date: dateISO, exercises: {} };
}

@Injectable({ providedIn: 'root' })
export class SessionsStore {
  private readonly api = inject(SessionsService);

  private readonly _activeDay = signal<string>(localGetActiveDay() ?? defaultDayForToday());
  private readonly _dateISO = signal<string>(todayISO());
  private readonly _today = signal<SessionDoc>(emptySession(this._activeDay(), this._dateISO()));
  private readonly _previous = signal<SessionDoc | null>(null);
  private readonly _loadingHistory = signal<boolean>(true);
  private readonly _status = signal<SaveStatus>({ kind: '', text: '' });

  readonly activeDay = this._activeDay.asReadonly();
  readonly today = this._today.asReadonly();
  readonly previous = this._previous.asReadonly();
  readonly loadingHistory = this._loadingHistory.asReadonly();
  readonly status = this._status.asReadonly();

  readonly activeDaySpec = computed<DaySpec>(() => getDay(this._activeDay()));

  private saveTimer?: ReturnType<typeof setTimeout>;
  private requestToken = 0;
  private statusClearTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    void this.selectDay(this._activeDay());
  }

  setsFor(exerciseId: string, targetCount: number) {
    const exercises = this._today().exercises;
    return ensureLength(exercises[exerciseId]?.sets ?? [], targetCount);
  }

  previousSetsFor(exerciseId: string) {
    return this._previous()?.exercises[exerciseId]?.sets ?? null;
  }

  async selectDay(dayId: string): Promise<void> {
    const token = ++this.requestToken;
    const dateISO = todayISO();

    this._activeDay.set(dayId);
    localSaveActiveDay(dayId);
    this._dateISO.set(dateISO);
    this._today.set(emptySession(dayId, dateISO));
    this._previous.set(null);
    this._loadingHistory.set(true);
    this._status.set({ kind: '', text: '' });

    const id = sessionId(dayId, dateISO);

    const [todayDoc, previousDoc] = await Promise.all([
      this.fetchSession(id),
      this.fetchPrevious(dayId, id),
    ]);

    if (token !== this.requestToken) return; // el usuario ya cambió de día

    if (todayDoc) this._today.set(todayDoc);
    this._previous.set(previousDoc);
    this._loadingHistory.set(false);
  }

  updateSet(exerciseId: string, index: number, role: 'kg' | 'reps', value: number | null): void {
    const current = this._today();
    const currentSets = current.exercises[exerciseId]?.sets ?? [];
    const newSets = currentSets.map((entry, i) => (i === index ? { ...entry, [role]: value } : entry));
    this._today.set({
      ...current,
      exercises: { ...current.exercises, [exerciseId]: { sets: newSets } },
    });
    this.scheduleSave();
  }

  private async fetchSession(id: string): Promise<SessionDoc | null> {
    try {
      const remote = await firstValueFrom(this.api.getSession(id));
      if (remote) localSaveSession(id, remote);
      return remote;
    } catch {
      return localGetSession(id);
    }
  }

  private async fetchPrevious(dayId: string, excludeId: string): Promise<SessionDoc | null> {
    try {
      return await firstValueFrom(this.api.getPrevious(dayId, excludeId));
    } catch {
      return localGetPrevious(dayId, excludeId);
    }
  }

  private scheduleSave(): void {
    this._status.set({ kind: 'saving', text: 'Guardando…' });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.persist(), 500);
  }

  private async persist(): Promise<void> {
    const snapshot: SessionDoc = { ...this._today(), updatedAt: new Date().toISOString() };
    this._today.set(snapshot);
    const id = sessionId(snapshot.day, snapshot.date);
    localSaveSession(id, snapshot);

    try {
      await firstValueFrom(this.api.saveSession(id, snapshot));
      this._status.set({ kind: 'saved', text: 'Guardado ✓' });
      clearTimeout(this.statusClearTimer);
      this.statusClearTimer = setTimeout(() => {
        if (this._status().text === 'Guardado ✓') this._status.set({ kind: '', text: '' });
      }, 2000);
    } catch {
      this._status.set({ kind: 'warn', text: 'Guardado en el teléfono' });
    }
  }
}
