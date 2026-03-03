import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerService } from '../../services/timer.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  timer = inject(TimerService);

  readonly radius = 163;
  readonly circumference = 2 * Math.PI * this.radius;

  readonly strokeDashoffset = computed(() => {
    const progress = this.timer.progress() / 100;
    return this.circumference * (1 - progress);
  });
}