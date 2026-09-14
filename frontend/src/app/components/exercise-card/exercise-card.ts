import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CAT_LABEL } from '../../data/routine';
import { ExerciseSpec, MuscleCategory, SetEntry } from '../../models/session.model';
import { fmtKg, shortDate, youtubeSearchUrl } from '../../utils/format';

const PILL_CLASSES: Record<MuscleCategory, string> = {
  glute: 'bg-cat-glute-bg text-cat-glute-fg',
  quad: 'bg-cat-quad-bg text-cat-quad-fg',
  ham: 'bg-cat-ham-bg text-cat-ham-fg',
  back: 'bg-cat-back-bg text-cat-back-fg',
  press: 'bg-cat-press-bg text-cat-press-fg',
};

interface SetRow {
  index: number;
  set: SetEntry;
  kgPlaceholder: string;
  repsPlaceholder: string;
}

export interface SetChangeEvent {
  index: number;
  role: 'kg' | 'reps';
  value: number | null;
}

@Component({
  selector: 'app-exercise-card',
  imports: [],
  templateUrl: './exercise-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExerciseCard {
  readonly ex = input.required<ExerciseSpec>();
  readonly sets = input.required<SetEntry[]>();
  readonly previousSets = input<SetEntry[] | null>(null);
  readonly previousDate = input<string | null>(null);
  readonly loadingHistory = input(false);

  readonly setChanged = output<SetChangeEvent>();
  readonly restRequested = output<number>();

  readonly catLabel = computed(() => CAT_LABEL[this.ex().cat]);
  readonly pillClasses = computed(() => PILL_CLASSES[this.ex().cat]);
  readonly videoUrl = computed(() => youtubeSearchUrl(this.ex().name));

  readonly rows = computed<SetRow[]>(() => {
    const previous = this.previousSets();
    return this.sets().map((set, index) => {
      const prev = previous?.[index] ?? null;
      const kgPh = prev ? fmtKg(prev.kg) : null;
      const repsPh = prev?.reps ?? null;
      return {
        index,
        set,
        kgPlaceholder: kgPh ? kgPh.replace('kg', '') : 'kg',
        repsPlaceholder: repsPh !== null ? String(repsPh) : 'reps',
      };
    });
  });

  readonly recap = computed<{ date: string; summary: string } | null>(() => {
    const previous = this.previousSets();
    const date = this.previousDate();
    if (!previous || !date) return null;
    const parts = previous
      .map((s) => {
        const kg = fmtKg(s.kg);
        const reps = s.reps ?? null;
        if (kg === null && reps === null) return null;
        return `${kg ?? '—'}×${reps ?? '—'}`;
      })
      .filter((p): p is string => p !== null);
    if (!parts.length) return null;
    return { date: shortDate(date), summary: parts.join(', ') };
  });

  onFieldInput(index: number, role: 'kg' | 'reps', event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    let value: number | null = raw === '' ? null : Number(raw);
    if (value !== null && Number.isNaN(value)) value = null;
    this.setChanged.emit({ index, role, value });
  }

  onRepsBlur(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (raw !== '') {
      this.restRequested.emit(this.ex().rest);
    }
  }
}
