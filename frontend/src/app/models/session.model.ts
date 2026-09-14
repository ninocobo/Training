export interface SetEntry {
  kg: number | null;
  reps: number | null;
}

export interface ExerciseSets {
  sets: SetEntry[];
}

export interface SessionDoc {
  day: string;
  date: string;
  exercises: Record<string, ExerciseSets>;
  updatedAt?: string;
}

export type MuscleCategory = 'glute' | 'quad' | 'ham' | 'back' | 'press';

export interface ExerciseSpec {
  id: string;
  name: string;
  sets: number;
  reps: string;
  cat: MuscleCategory;
  rest: number;
  cue: string;
}

export interface DaySpec {
  id: string;
  label: string;
  full: string;
  subtitle: string;
  exercises: ExerciseSpec[];
}

export interface SaveStatus {
  kind: '' | 'saving' | 'saved' | 'warn';
  text: string;
}
