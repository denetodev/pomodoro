import { Injectable, signal, computed, effect, inject } from '@angular/core';
import {
  TimerMode,
  TimerSettings,
  DEFAULT_SETTINGS,
  COLOR_MAP,
  FONT_MAP,
} from '../models/timer.model';
import { AudioService } from './audio.service';

@Injectable({ providedIn: 'root' })
export class TimerService {

  private audio = inject(AudioService);

  // ── Signals ───────────────────────────────────────────────────────────
  readonly settings     = signal<TimerSettings>({ ...DEFAULT_SETTINGS });
  readonly mode         = signal<TimerMode>('pomodoro');
  readonly isRunning    = signal(false);
  readonly secondsLeft  = signal(DEFAULT_SETTINGS.pomodoro * 60);
  readonly pomodoroCount = signal(0); // quantos pomodoros completos no ciclo

  // ── Computed ──────────────────────────────────────────────────────────
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

  // ── Próximo modo (para exibir na UI) ──────────────────────────────────
  readonly nextMode = computed<TimerMode>(() => {
    const mode  = this.mode();
    const count = this.pomodoroCount();
    if (mode === 'pomodoro') {
      return (count + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
    }
    return 'pomodoro';
  });

  // ── Privado ───────────────────────────────────────────────────────────
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Quando o modo muda manualmente → reseta sem tocar som
    effect(() => {
      const total = this.totalSeconds();
      this.pause();
      this.secondsLeft.set(total);
    });

    // CSS variables
    effect(() => {
      document.documentElement.style.setProperty('--accent', this.accentColor());
      document.documentElement.style.setProperty('--font-body', this.fontFamily());
    });
  }

  // ── Ações públicas ────────────────────────────────────────────────────
  toggle(): void {
    if (this.isRunning()) {
      this.pause();
    } else {
      this.start();
    }
  }

  start(): void {
    if (this.secondsLeft() === 0) this.secondsLeft.set(this.totalSeconds());

    // Para o alarme (caso esteja em loop aguardando o usuário)
    this.audio.stopAlarm();

    // Toca som de início apenas no pomodoro
    if (this.mode() === 'pomodoro') {
      this.audio.playStartPomodoro();
    }

    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      const current = this.secondsLeft();
      if (current <= 0) {
        this.onTimerComplete();
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
    this.audio.stopAlarm();
    this.mode.set(mode);
  }

  applySettings(newSettings: TimerSettings): void {
    this.audio.stopAlarm();
    this.settings.set({ ...newSettings });
    const m = this.mode();
    const secs =
      m === 'pomodoro'   ? newSettings.pomodoro * 60 :
      m === 'shortBreak' ? newSettings.shortBreak * 60 :
                           newSettings.longBreak * 60;
    this.pause();
    this.secondsLeft.set(secs);
  }

  // ── Ciclo automático ──────────────────────────────────────────────────
  private onTimerComplete(): void {
    this.pause();
    this.secondsLeft.set(0);

    const currentMode = this.mode();

    if (currentMode === 'pomodoro') {
      const newCount = this.pomodoroCount() + 1;
      this.pomodoroCount.set(newCount);
      const nextMode: TimerMode = newCount % 4 === 0 ? 'longBreak' : 'shortBreak';
      this.audio.startAlarmLoop('endPomodoro');
      this.advanceTo(nextMode);

    } else if (currentMode === 'shortBreak') {
      this.audio.startAlarmLoop('endBreak');
      this.advanceTo('pomodoro');

    } else if (currentMode === 'longBreak') {
      this.pomodoroCount.set(0);
      this.audio.startAlarmLoop('endLongBreak');
      this.advanceTo('pomodoro');
    }
  }

  private advanceTo(mode: TimerMode): void {
    // Muda o modo e deixa pausado — usuário clica START para iniciar
    this.mode.set(mode);
    // O effect já reseta o secondsLeft automaticamente
  }
}