import { Injectable, signal } from '@angular/core';
import { AmbientSound } from '../models/timer.model';

@Injectable({ providedIn: 'root' })
export class AudioService {

  readonly ambientSound  = signal<AmbientSound>('none');
  readonly ambientVolume = signal(0.5);

  private ctx: AudioContext | null = null;
  private ambientNodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;
  private ambientTimeouts: ReturnType<typeof setTimeout>[] = [];
  private ambientGeneration = 0;
  private alarmLoopId: ReturnType<typeof setTimeout> | null = null;

  // ── Contexto ───────────────────────────────────────────────────────────
  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ── Alarmes ────────────────────────────────────────────────────────────

  playStartPomodoro(): void {
    const ctx = this.getCtx();
    this.beep(ctx, 520, 0.00, 0.12, 'sine');
    this.beep(ctx, 660, 0.15, 0.12, 'sine');
  }

  playEndPomodoro(): void {
    const ctx = this.getCtx();
    [0, 0.35, 0.70].forEach(offset => {
      this.beep(ctx, 1046, offset,        0.05, 'sine');
      this.beep(ctx, 1318, offset + 0.06, 0.05, 'sine');
      this.beep(ctx, 1568, offset + 0.12, 0.20, 'sine');
    });
  }

  playEndBreak(): void {
    const ctx = this.getCtx();
    this.beep(ctx, 440, 0.00, 0.15, 'sine');
    this.beep(ctx, 880, 0.20, 0.25, 'sine');
  }

  playEndLongBreak(): void {
    const ctx = this.getCtx();
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      this.beep(ctx, freq, i * 0.18, 0.16, 'triangle');
    });
    [523, 659, 784].forEach(freq => {
      this.beep(ctx, freq, notes.length * 0.18, 0.40, 'sine');
    });
  }

  private beep(
    ctx: AudioContext,
    frequency: number,
    startOffset: number,
    duration: number,
    type: OscillatorType
  ): void {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + startOffset);
    gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startOffset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration + 0.05);
  }

  // ── Alarmes em loop ────────────────────────────────────────────────────

  startAlarmLoop(type: 'endPomodoro' | 'endBreak' | 'endLongBreak'): void {
    this.stopAlarm();
    const intervalMs = type === 'endLongBreak' ? 3200 : type === 'endPomodoro' ? 2600 : 2000;
    const play = () => {
      if      (type === 'endPomodoro')  this.playEndPomodoro();
      else if (type === 'endBreak')     this.playEndBreak();
      else                              this.playEndLongBreak();
      this.alarmLoopId = setTimeout(play, intervalMs);
    };
    play();
  }

  stopAlarm(): void {
    if (this.alarmLoopId) {
      clearTimeout(this.alarmLoopId);
      this.alarmLoopId = null;
    }
  }

  // ── Sons ambiente ──────────────────────────────────────────────────────

  setAmbient(sound: AmbientSound): void {
    this.stopAmbient();
    this.ambientSound.set(sound);
    if (sound !== 'none') this.startAmbient(sound);
  }

  setAmbientVolume(volume: number): void {
    this.ambientVolume.set(volume);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.getCtx().currentTime);
    }
  }

  private startAmbient(sound: AmbientSound): void {
    const ctx = this.getCtx();
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.ambientVolume(), ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    switch (sound) {
      case 'rain':       this.createRain(ctx);       break;
      case 'whitenoise': this.createWhiteNoise(ctx);  break;
      case 'cafe':       this.createCafe(ctx);        break;
      case 'forest':     this.createForest(ctx);      break;
      case 'ocean':      this.createOcean(ctx);       break;
      case 'fireplace':  this.createFireplace(ctx);   break;
      case 'fan':        this.createFan(ctx);         break;
      case 'train':      this.createTrain(ctx);       break;
    }
  }

  stopAmbient(): void {
    // Invalida todos os callbacks agendados
    this.ambientGeneration++;
    this.ambientTimeouts.forEach(id => clearTimeout(id));
    this.ambientTimeouts = [];

    this.ambientNodes.forEach(node => {
      try { (node as AudioBufferSourceNode).stop(); } catch {}
      try { (node as OscillatorNode).stop(); } catch {}
    });
    this.ambientNodes = [];
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }

  // ── Helpers de agendamento ─────────────────────────────────────────────

  /** Agenda um callback periódico vinculado à geração atual. */
  private schedule(fn: () => void, delayMs: number): void {
    const id = setTimeout(fn, delayMs);
    this.ambientTimeouts.push(id);
  }

  /** Retorna true se o som ainda está ativo para esta geração. */
  private isActive(gen: number): boolean {
    return this.ambientGeneration === gen && this.masterGain !== null;
  }

  // ── Geradores ──────────────────────────────────────────────────────────

  private createRain(ctx: AudioContext): void {
    // Ruído filtrado simulando chuva persistente
    const noise  = this.noiseSource(ctx);
    const band   = this.biquad(ctx, 'bandpass', 1200, 0.6);
    const high   = this.biquad(ctx, 'highpass', 600);
    noise.connect(band);
    band.connect(high);
    high.connect(this.masterGain!);
    noise.start();
    this.ambientNodes.push(noise);

    // Gotas individuais
    this.scheduleDrops(ctx, this.ambientGeneration);
  }

  private scheduleDrops(ctx: AudioContext, gen: number): void {
    const drop = () => {
      if (!this.isActive(gen)) return;
      const freq = 1800 + Math.random() * 1200;
      this.beepTo(ctx, freq, 0.04, 'sine', this.masterGain!, 0.06);
      this.schedule(drop, 200 + Math.random() * 600);
    };
    this.schedule(drop, 400);
  }

  private createWhiteNoise(ctx: AudioContext): void {
    const source = this.noiseSource(ctx);
    const low    = this.biquad(ctx, 'lowpass', 6000);
    const high   = this.biquad(ctx, 'highpass', 20);
    source.connect(low);
    low.connect(high);
    high.connect(this.masterGain!);
    source.start();
    this.ambientNodes.push(source);
  }

  private createCafe(ctx: AudioContext): void {
    // Burburinho de fundo — ruído de banda média
    const noise  = this.noiseSource(ctx);
    const filter = this.biquad(ctx, 'bandpass', 900, 1.5);
    noise.connect(filter);
    filter.connect(this.masterGain!);
    noise.start();
    this.ambientNodes.push(noise);

    // Vozes murmurando — osciladores com vibrato lento
    [160, 200, 260, 310, 380].forEach((freq, i) => {
      const osc     = ctx.createOscillator();
      const g       = ctx.createGain();
      const lfo     = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      lfo.frequency.value = 0.2 + i * 0.08;
      lfoGain.gain.value  = 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);

      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.025;

      osc.connect(g);
      g.connect(this.masterGain!);
      lfo.start();
      osc.start();
      this.ambientNodes.push(osc, lfo);
    });

    // Louças ocasionais
    this.scheduleClinks(ctx, this.ambientGeneration);
  }

  private scheduleClinks(ctx: AudioContext, gen: number): void {
    const clink = () => {
      if (!this.isActive(gen)) return;
      const freq = 2400 + Math.random() * 800;
      this.beepTo(ctx, freq, 0.03, 'sine', this.masterGain!, 0.05);
      // Eco do clink (não precisa ser rastreado — é curto e usa isActive na geração atual)
      const echoId = setTimeout(() => {
        if (!this.isActive(gen)) return;
        this.beepTo(ctx, freq * 0.8, 0.02, 'sine', this.masterGain!, 0.04);
      }, 80);
      this.ambientTimeouts.push(echoId);
      this.schedule(clink, 3000 + Math.random() * 6000);
    };
    this.schedule(clink, 2000 + Math.random() * 3000);
  }

  private createForest(ctx: AudioContext): void {
    // Vento suave com variação de frequência
    const wind   = this.noiseSource(ctx);
    const filter = this.biquad(ctx, 'bandpass', 400, 1.5);
    const lfo    = ctx.createOscillator();
    const lfoG   = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoG.gain.value     = 150;
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);
    wind.connect(filter);
    filter.connect(this.masterGain!);
    wind.start();
    lfo.start();
    this.ambientNodes.push(wind, lfo);

    // Folhas — camada de ruído de alta frequência suave
    const leaves  = this.noiseSource(ctx);
    const leavesF = this.biquad(ctx, 'highpass', 4000);
    const leavesG = ctx.createGain();
    leavesG.gain.value = 0.12;
    leaves.connect(leavesF);
    leavesF.connect(leavesG);
    leavesG.connect(this.masterGain!);
    leaves.start();
    this.ambientNodes.push(leaves);

    // Pássaros
    this.scheduleBirds(ctx, this.ambientGeneration);
  }

  private scheduleBirds(ctx: AudioContext, gen: number): void {
    const chirp = () => {
      if (!this.isActive(gen)) return;
      const base = 2200 + Math.random() * 1800;
      // Sequência de 2-4 gorjeios rápidos
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const delayId = setTimeout(() => {
          if (!this.isActive(gen)) return;
          this.beepTo(ctx, base * (1 + i * 0.08), 0.07, 'sine', this.masterGain!, 0.07);
        }, i * 120);
        this.ambientTimeouts.push(delayId);
      }
      this.schedule(chirp, 1200 + Math.random() * 3500);
    };
    this.schedule(chirp, 600 + Math.random() * 1200);
  }

  private createOcean(ctx: AudioContext): void {
    // Ondas — ruído com ganho modulado por LFO lento (sem valores negativos)
    const noise  = this.noiseSource(ctx);
    const filter = this.biquad(ctx, 'lowpass', 700);
    const waveG  = ctx.createGain();

    // Usa ConstantSourceNode + GainNode para LFO com offset positivo
    const lfoOsc  = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const lfoOffset = ctx.createConstantSource();

    lfoOsc.frequency.value  = 0.12; // ~8 s por onda
    lfoGain.gain.value      = 0.35; // amplitude da modulação
    lfoOffset.offset.value  = 0.35; // valor base do gain (nunca vai a zero)

    waveG.gain.value = 0; // controlado pelos LFOs

    lfoOsc.connect(lfoGain);
    lfoGain.connect(waveG.gain);
    lfoOffset.connect(waveG.gain);

    noise.connect(filter);
    filter.connect(waveG);
    waveG.connect(this.masterGain!);

    noise.start();
    lfoOsc.start();
    lfoOffset.start();
    this.ambientNodes.push(noise, lfoOsc, lfoOffset);

    // Espuma — highpass sutil
    const foam  = this.noiseSource(ctx);
    const foamF = this.biquad(ctx, 'highpass', 3500);
    const foamG = ctx.createGain();
    foamG.gain.value = 0.08;
    foam.connect(foamF);
    foamF.connect(foamG);
    foamG.connect(this.masterGain!);
    foam.start();
    this.ambientNodes.push(foam);
  }

  private createFireplace(ctx: AudioContext): void {
    // Crepitação base — ruído com filtro na faixa grave-médio
    const noise  = this.noiseSource(ctx);
    const filter = this.biquad(ctx, 'bandpass', 250, 0.4);
    const lfo    = ctx.createOscillator();
    const lfoG   = ctx.createGain();

    lfo.frequency.value = 0.6;
    lfoG.gain.value     = 120;
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);
    noise.connect(filter);
    filter.connect(this.masterGain!);
    noise.start();
    lfo.start();
    this.ambientNodes.push(noise, lfo);

    // Camada grave do fogo
    const base  = this.noiseSource(ctx);
    const baseF = this.biquad(ctx, 'lowpass', 180);
    const baseG = ctx.createGain();
    baseG.gain.value = 0.4;
    base.connect(baseF);
    baseF.connect(baseG);
    baseG.connect(this.masterGain!);
    base.start();
    this.ambientNodes.push(base);

    // Estalos
    this.scheduleCrackles(ctx, this.ambientGeneration);
  }

  private scheduleCrackles(ctx: AudioContext, gen: number): void {
    const crackle = () => {
      if (!this.isActive(gen)) return;
      const freq = 300 + Math.random() * 400;
      this.beepTo(ctx, freq, 0.008, 'sawtooth', this.masterGain!, 0.12);
      this.schedule(crackle, 150 + Math.random() * 500);
    };
    this.schedule(crackle, 200);
  }

  private createFan(ctx: AudioContext): void {
    // Tom mecânico constante com harmônicos
    [60, 120, 180, 240].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      g.gain.value = i === 0 ? 0.15 : 0.05 / (i + 1);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start();
      this.ambientNodes.push(osc);
    });

    // Ruído de ar
    const air    = this.noiseSource(ctx);
    const airF   = this.biquad(ctx, 'bandpass', 280, 2);
    const airG   = ctx.createGain();
    airG.gain.value = 0.25;
    air.connect(airF);
    airF.connect(airG);
    airG.connect(this.masterGain!);
    air.start();
    this.ambientNodes.push(air);
  }

  private createTrain(ctx: AudioContext): void {
    // Ronco grave do motor — ruído de baixa frequência
    const rumble  = this.noiseSource(ctx);
    const rumbleF = this.biquad(ctx, 'lowpass', 200);
    const rumbleG = ctx.createGain();
    rumbleG.gain.value = 0.7;
    rumble.connect(rumbleF);
    rumbleF.connect(rumbleG);
    rumbleG.connect(this.masterGain!);
    rumble.start();
    this.ambientNodes.push(rumble);

    // Vento de velocidade — highpass
    const wind  = this.noiseSource(ctx);
    const windF = this.biquad(ctx, 'highpass', 1800);
    const windG = ctx.createGain();
    windG.gain.value = 0.15;
    wind.connect(windF);
    windF.connect(windG);
    windG.connect(this.masterGain!);
    wind.start();
    this.ambientNodes.push(wind);

    // Trilhos — cliques rítmicos com dois pulsos por ciclo (ta-DUM)
    this.scheduleRailClicks(ctx, this.ambientGeneration);
  }

  private scheduleRailClicks(ctx: AudioContext, gen: number): void {
    const cycleMs = 900; // duração de um ciclo ta-DUM
    const click = () => {
      if (!this.isActive(gen)) return;

      // Primeiro impacto (fraco)
      this.beepTo(ctx, 160, 0.04, 'sawtooth', this.masterGain!, 0.18);

      // Segundo impacto (forte) — característico do trilho
      const secondId = setTimeout(() => {
        if (!this.isActive(gen)) return;
        this.beepTo(ctx, 130, 0.06, 'sawtooth', this.masterGain!, 0.25);
      }, 180);
      this.ambientTimeouts.push(secondId);

      this.schedule(click, cycleMs + (Math.random() * 60 - 30));
    };
    this.schedule(click, 100);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private noiseSource(ctx: AudioContext): AudioBufferSourceNode {
    const sampleRate = ctx.sampleRate;
    const buffer     = ctx.createBuffer(1, sampleRate * 3, sampleRate);
    const data       = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;
    return source;
  }

  private biquad(
    ctx: AudioContext,
    type: BiquadFilterType,
    frequency: number,
    q = 1
  ): BiquadFilterNode {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    return f;
  }

  private beepTo(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    destination: AudioNode,
    volume = 0.08
  ): void {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(destination);
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  }
}
