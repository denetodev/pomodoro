import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { AmbientSound, AMBIENT_LABELS } from '../../models/timer.model';

@Component({
  selector: 'app-ambient-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ambient-player.component.html',
  styleUrl: './ambient-player.component.scss',
})
export class AmbientPlayerComponent {
  audio = inject(AudioService);

  isOpen = false;

  sounds: { value: AmbientSound; icon: string }[] = [
    { value: 'none', icon: '🔇' },
    { value: 'rain', icon: '🌧️' },
    { value: 'whitenoise', icon: '〰️' },
    { value: 'cafe', icon: '☕' },
    { value: 'forest', icon: '🌿' },
    { value: 'ocean', icon: '🌊' },
    { value: 'fireplace', icon: '🔥' },
    { value: 'fan', icon: '💨' },
    { value: 'train', icon: '🚂' },
  ];

  labels = AMBIENT_LABELS;

  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  selectSound(sound: AmbientSound): void {
    this.audio.setAmbient(sound);
  }

  onVolumeChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.audio.setAmbientVolume(value / 100);
  }
}