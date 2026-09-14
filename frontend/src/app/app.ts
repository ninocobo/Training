import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { ExerciseCard, SetChangeEvent } from './components/exercise-card/exercise-card';
import { RestTimer } from './components/rest-timer/rest-timer';
import { DAYS } from './data/routine';
import { SessionsStore } from './state/sessions-store';

@Component({
  selector: 'app-root',
  imports: [ExerciseCard, RestTimer],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly days = DAYS;
  protected readonly store = inject(SessionsStore);

  protected readonly restTimer = viewChild.required(RestTimer);

  protected readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
  );

  selectDay(dayId: string): void {
    void this.store.selectDay(dayId);
  }

  onSetChanged(exerciseId: string, event: SetChangeEvent): void {
    this.store.updateSet(exerciseId, event.index, event.role, event.value);
  }

  onRestRequested(seconds: number): void {
    this.restTimer().startFor(seconds);
  }
}
