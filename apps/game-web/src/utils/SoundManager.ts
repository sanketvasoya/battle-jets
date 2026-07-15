class SoundManager {
  private ctx: AudioContext | null = null;
  private jetpackOsc: OscillatorNode | null = null;
  private jetpackGain: GainNode | null = null;
  private globalVolumeSFX = 0.7;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumeSFX(volume: number) {
    this.globalVolumeSFX = volume;
    if (this.jetpackGain) {
      this.jetpackGain.gain.setValueAtTime(volume * 0.15, this.ctx?.currentTime || 0);
    }
  }

  public playAR() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playShotgun() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep Boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.25);
    oscGain.gain.setValueAtTime(this.globalVolumeSFX * 0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    // Noise Blast
    const bufferSize = this.ctx.sampleRate * 0.15; // 150ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Low pass filter on noise
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.globalVolumeSFX * 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  public playSniper() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playRocket() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.4);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playExplosion() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Deep sine wave boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(10, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);

    oscGain.gain.setValueAtTime(this.globalVolumeSFX * 1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Large Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5; // 500ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(600, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.globalVolumeSFX * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.5);
  }

  public startJetpack() {
    this.initCtx();
    if (!this.ctx || this.jetpackOsc) return;

    const now = this.ctx.currentTime;
    this.jetpackOsc = this.ctx.createOscillator();
    this.jetpackGain = this.ctx.createGain();

    this.jetpackOsc.type = 'triangle';
    this.jetpackOsc.frequency.setValueAtTime(95, now);

    // Add filter for rumble feel
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);

    this.jetpackGain.gain.setValueAtTime(this.globalVolumeSFX * 0.15, now);

    this.jetpackOsc.connect(filter);
    filter.connect(this.jetpackGain);
    this.jetpackGain.connect(this.ctx.destination);

    this.jetpackOsc.start(now);
  }

  public stopJetpack() {
    if (this.jetpackOsc) {
      try {
        this.jetpackOsc.stop();
      } catch (e) {}
      this.jetpackOsc.disconnect();
      this.jetpackGain?.disconnect();
      this.jetpackOsc = null;
      this.jetpackGain = null;
    }
  }

  public playJump() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(350, now + 0.12);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDeath() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playRespawn() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord chime
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(this.globalVolumeSFX * 0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  }

  public playMatchStart() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.4, now);
    gain.gain.setValueAtTime(0, now + 0.15);
    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.4, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  }

  public playSMG() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playPistol() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playEnergy() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playMelee() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.globalVolumeSFX * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  public playMatchEnd() {
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Short victory arpeggio
    const chord = [349.23, 440.00, 523.25, 587.33, 698.46]; // F major arpeggio
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(this.globalVolumeSFX * 0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.3);
    });
  }
}

export const soundManager = new SoundManager();
export default soundManager;
