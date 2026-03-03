import { Injectable, signal, computed, effect } from '@angular/core';
import {
  TimerMode,
  TimerSettings,
  DEFAULT_SETTINGS,
  COLOR_MAP,
  FONT_MAP,
} from '../models/timer.model';

@Injectable({ providedIn: 'root' })
export class TimerService {

  // ── Signals (estado reativo) ──────────────────────────────────────────
  readonly settings  = signal<TimerSettings>({ ...DEFAULT_SETTINGS });
  readonly mode      = signal<TimerMode>('pomodoro');
  readonly isRunning = signal(false);
  readonly secondsLeft = signal(DEFAULT_SETTINGS.pomodoro * 60);

  // ── Computed (derivados automáticos) ──────────────────────────────────
  readonly totalSeconds = computed(() => {
    const s = this.settings();
    const m = this.mode();
    if (m === 'pomodoro')   return s.pomodoro * 60;
    if (m === 'shortBreak') return s.shortBreak * 60;
    return s.longBreak * 60;
  });

  readonly progress = computed(() => {
    const total = this.totalSeconds();
    return total === 0 ? 0 : (this.secondsLeft() / total) * 100;
  });

  readonly displayTime = computed(() => {
    const secs = this.secondsLeft();
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  readonly accentColor = computed(() => COLOR_MAP[this.settings().color]);
  readonly fontFamily  = computed(() => FONT_MAP[this.settings().font]);

  // ── Privado ───────────────────────────────────────────────────────────
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Quando o modo muda → reseta o timer automaticamente
    effect(() => {
      const total = this.totalSeconds();
      this.pause();
      this.secondsLeft.set(total);
    });

    // Quando cor ou fonte muda → aplica CSS variables no documento
    effect(() => {
      document.documentElement.style.setProperty('--accent', this.accentColor());
      document.documentElement.style.setProperty('--font-body', this.fontFamily());
    });
  }

  // ── Ações públicas ────────────────────────────────────────────────────
  toggle(): void {
    this.isRunning() ? this.pause() : this.start();
  }

  start(): void {
    if (this.secondsLeft() === 0) this.secondsLeft.set(this.totalSeconds());
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      const current = this.secondsLeft();
      if (current <= 0) {
        this.pause();
        this.secondsLeft.set(0);
      } else {
        this.secondsLeft.set(current - 1);
      }
    }, 1000);
  }

  pause(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setMode(mode: TimerMode): void {
    this.mode.set(mode);
  }

  applySettings(newSettings: TimerSettings): void {
    this.settings.set({ ...newSettings });
    const m = this.mode();
    const secs =
      m === 'pomodoro'   ? newSettings.pomodoro * 60 :
      m === 'shortBreak' ? newSettings.shortBreak * 60 :
                           newSettings.longBreak * 60;
    this.pause();
    this.secondsLeft.set(secs);
  }
}