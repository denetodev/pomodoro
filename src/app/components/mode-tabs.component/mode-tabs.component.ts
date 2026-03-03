import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../services/timer.service';
import { TimerMode } from '../../models/timer.model';

@Component({
  selector: 'app-mode-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mode-tabs.component.html',
  styleUrl: './mode-tabs.component.scss',
})
export class ModeTabsComponent {
  timer = inject(TimerService);

  tabs: { label: string; value: TimerMode }[] = [
    { label: 'pomodoro',    value: 'pomodoro'    },
    { label: 'short break', value: 'shortBreak'  },
    { label: 'long break',  value: 'longBreak'   },
  ];

  select(mode: TimerMode): void {
    this.timer.setMode(mode);
  }
}