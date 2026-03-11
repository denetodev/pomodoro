import { Component, ViewChild } from '@angular/core';
import { TimerComponent } from './components/timer/timer.component';
import { SettingsModalComponent } from './components/settings-modal.component/settings-modal.component';
import { AmbientPlayerComponent } from './components/ambient-player/ambient-player.component';
import { ModeTabsComponent } from './components/mode-tabs.component/mode-tabs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModeTabsComponent, TimerComponent, SettingsModalComponent, AmbientPlayerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('modal') modal!: SettingsModalComponent;
}