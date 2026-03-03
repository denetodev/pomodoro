import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimerService } from '../../services/timer.service';
import {
  AccentColor,
  FontFamily,
  TimerSettings,
  COLOR_MAP,
} from '../../models/timer.model';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss',
})
export class SettingsModalComponent {
  timer = inject(TimerService);
  isOpen = signal(false);

  draft = signal<TimerSettings>({ ...this.timer.settings() });

  fonts: { value: FontFamily; style: string }[] = [
    { value: 'kumbh',  style: "'Kumbh Sans', sans-serif" },
    { value: 'roboto', style: "'Roboto Slab', serif"     },
    { value: 'space',  style: "'Space Mono', monospace"  },
  ];

  colors: { value: AccentColor; hex: string }[] = [
    { value: 'coral',  hex: COLOR_MAP.coral  },
    { value: 'cyan',   hex: COLOR_MAP.cyan   },
    { value: 'purple', hex: COLOR_MAP.purple },
  ];

  open(): void {
    this.draft.set({ ...this.timer.settings() });
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  apply(): void {
    this.timer.applySettings({ ...this.draft() });
    this.close();
  }

  updateMinutes(
    field: keyof Pick<TimerSettings, 'pomodoro' | 'shortBreak' | 'longBreak'>,
    value: number
  ): void {
    const clamped = Math.max(1, Math.min(99, value));
    this.draft.update(d => ({ ...d, [field]: clamped }));
  }

  setFont(font: FontFamily): void {
    this.draft.update(d => ({ ...d, font }));
  }

  setColor(color: AccentColor): void {
    this.draft.update(d => ({ ...d, color }));
  }
}