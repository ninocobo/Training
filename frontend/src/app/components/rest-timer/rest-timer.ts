import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-rest-timer',
  imports: [],
  templateUrl: './rest-timer.html',
  styleUrl: './rest-timer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestTimer {
  private readonly totalSec = signal(90);
  private readonly remainingSec = signal(90);
  readonly running = signal(false);
  readonly justFinished = signal(false);

  readonly display = computed(() => {
    const remaining = this.remainingSec();
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  });

  readonly progressPercent = computed(() => {
    const total = this.totalSec();
    return total ? Math.round((this.remainingSec() / total) * 100) : 0;
  });

  readonly toggleLabel = computed(() => {
    if (this.running()) return 'Pausar';
    return this.remainingSec() === 0 ? 'Reiniciar' : 'Iniciar';
  });

  private intervalId?: ReturnType<typeof setInterval>;
  private finishedResetTimer?: ReturnType<typeof setTimeout>;

  startFor(seconds: number): void {
    this.totalSec.set(seconds);
    this.remainingSec.set(seconds);
    this.justFinished.set(false);
    this.start();
  }

  toggle(): void {
    this.running() ? this.pause() : this.start();
  }

  reset(): void {
    this.pause();
    this.remainingSec.set(this.totalSec());
    this.justFinished.set(false);
  }

  private start(): void {
    if (this.remainingSec() <= 0) this.remainingSec.set(this.totalSec());
    this.running.set(true);
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  private pause(): void {
    this.running.set(false);
    clearInterval(this.intervalId);
  }

  private tick(): void {
    const next = this.remainingSec() - 1;
    if (next <= 0) {
      this.remainingSec.set(0);
      this.pause();
      this.onFinished();
      return;
    }
    this.remainingSec.set(next);
  }

  private onFinished(): void {
    try {
      navigator.vibrate?.([200, 100, 200]);
    } catch {
      /* la vibración no está disponible en este dispositivo */
    }
    this.beep();
    this.justFinished.set(true);
    clearTimeout(this.finishedResetTimer);
    this.finishedResetTimer = setTimeout(() => this.justFinished.set(false), 1200);
  }

  private beep(): void {
    try {
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.55);
    } catch {
      /* audio no disponible: el aviso por vibración basta */
    }
  }
}
