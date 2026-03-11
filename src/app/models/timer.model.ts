export type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';
export type AccentColor = 'coral' | 'cyan' | 'purple';
export type FontFamily = 'kumbh' | 'roboto' | 'space';
export type AmbientSound =
  | 'none'
  | 'rain'
  | 'whitenoise'
  | 'cafe'
  | 'forest'
  | 'ocean'
  | 'fireplace'
  | 'fan'
  | 'train';

export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  font: FontFamily;
  color: AccentColor;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  font: 'kumbh',
  color: 'coral',
};

export const COLOR_MAP: Record<AccentColor, string> = {
  coral:  '#f87070',
  cyan:   '#70f3f8',
  purple: '#d881f8',
};

export const FONT_MAP: Record<FontFamily, string> = {
  kumbh:  "'Kumbh Sans', sans-serif",
  roboto: "'Roboto Slab', serif",
  space:  "'Space Mono', monospace",
};

export const AMBIENT_LABELS: Record<AmbientSound, string> = {
  none:       'Off',
  rain:       'Chuva',
  whitenoise: 'Ruído Branco',
  cafe:       'Cafeteria',
  forest:     'Floresta',
  ocean:      'Oceano',
  fireplace:  'Lareira',
  fan:        'Ventilador',
  train:      'Trem',
};