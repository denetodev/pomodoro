import { Component, ViewChild } from '@angular/core';
import { ModeTabsComponent } from './components/mode-tabs.component/mode-tabs.component';
import { TimerComponent } from './components/timer/timer.component';
import { SettingsModalComponent } from './components/settings-modal.component/settings-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModeTabsComponent, TimerComponent, SettingsModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('modal') modal!: SettingsModalComponent;
}