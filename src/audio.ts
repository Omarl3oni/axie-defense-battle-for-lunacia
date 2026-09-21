export type MusicTrack = 'title' | 'battle';

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private isSfxMuted: boolean = false;
  private musicVolume: number = 0.7;
  private sfxVolume: number = 0.8;

  // Dual-Track Audio Elements
  private titleAudio: HTMLAudioElement | null = null;
  private battleAudio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack = 'title';
  private isMusicPlaying: boolean = false;

  private titleTrackPath: string = '/assets/audio/bgm.mp3';
  private battleTrackPath: string = '/assets/audio/game_song.mp3';

  constructor() {
    try {
      const savedMusic = localStorage.getItem('axie_music_vol');
      if (savedMusic !== null) {
        this.musicVolume = parseFloat(savedMusic);
        this.isMusicMuted = this.musicVolume <= 0;
      }
      const savedSfx = localStorage.getItem('axie_sfx_vol');
      if (savedSfx !== null) {
        this.sfxVolume = parseFloat(savedSfx);
        this.isSfxMuted = this.sfxVolume <= 0;
      }
    } catch {
      // Ignore localStorage errors in sandboxed contexts
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    this.isMusicMuted = this.musicVolume <= 0;
    const vol = (this.isMuted || this.isMusicMuted) ? 0 : this.musicVolume;
    if (this.titleAudio) this.titleAudio.volume = vol;
    if (this.battleAudio) this.battleAudio.volume = vol;
    try {
      localStorage.setItem('axie_music_vol', this.musicVolume.toString());
    } catch {}
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    this.isSfxMuted = this.sfxVolume <= 0;
    try {
      localStorage.setItem('axie_sfx_vol', this.sfxVolume.toString());
    } catch {}
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public toggleSfx(enable?: boolean): boolean {
    if (enable !== undefined) {
      this.isSfxMuted = !enable;
    } else {
      this.isSfxMuted = !this.isSfxMuted;
    }
    return !this.isSfxMuted;
  }

  public isSfxActive(): boolean {
    return !this.isSfxMuted && this.sfxVolume > 0 && !this.isMuted;
  }

  public isMusicActive(): boolean {
    return !this.isMusicMuted && this.musicVolume > 0 && !this.isMuted && this.isMusicRunning();
  }

  public playShoot() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHit() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playGem() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    const freqs = [659, 784, 987, 1318];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + 0.08);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playLevelUp() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.2 * this.sfxVolume, time);
      gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, time + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.25);
    });
  }

  public playPlayerHurt() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playGameOver() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [330, 311, 293, 261];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + idx * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, time);
      gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, time + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.35);
    });
  }

  public playError() {
    if (this.isMuted || this.isSfxMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * this.sfxVolume, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public isMusicRunning(): boolean {
    return this.isMusicPlaying || (this.titleAudio !== null && !this.titleAudio.paused) || (this.battleAudio !== null && !this.battleAudio.paused);
  }

  public getCurrentTrack(): MusicTrack {
    return this.currentTrack;
  }

  public toggleMusic(): boolean {
    if (this.isMusicRunning()) {
      this.stopMusic();
      return false;
    } else {
      if (this.currentTrack === 'battle') {
        this.playBattleMusic();
      } else {
        this.playTitleMusic();
      }
      return true;
    }
  }

  public playTitleMusic(resetTime: boolean = true) {
    this.initContext();
    this.currentTrack = 'title';

    // Stop battle music
    if (this.battleAudio) {
      this.battleAudio.pause();
      this.battleAudio.currentTime = 0;
    }

    if (this.isMusicMuted || this.isMuted || this.musicVolume <= 0) {
      this.isMusicPlaying = false;
      return;
    }

    if (!this.titleAudio) {
      this.titleAudio = new Audio(this.titleTrackPath);
      this.titleAudio.loop = true;
    }

    if (resetTime) {
      this.titleAudio.currentTime = 0;
    }

    this.titleAudio.volume = this.musicVolume;
    const playPromise = this.titleAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isMusicPlaying = true;
        })
        .catch(() => {
          this.isMusicPlaying = false;
        });
    }
  }

  public playBattleMusic(resetTime: boolean = true) {
    this.initContext();
    this.currentTrack = 'battle';

    // Stop title music
    if (this.titleAudio) {
      this.titleAudio.pause();
      this.titleAudio.currentTime = 0;
    }

    if (this.isMusicMuted || this.isMuted || this.musicVolume <= 0) {
      this.isMusicPlaying = false;
      return;
    }

    if (!this.battleAudio) {
      this.battleAudio = new Audio(this.battleTrackPath);
      this.battleAudio.loop = true;
    }

    if (resetTime) {
      this.battleAudio.currentTime = 0;
    }

    this.battleAudio.volume = this.musicVolume;
    const playPromise = this.battleAudio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isMusicPlaying = true;
        })
        .catch(() => {
          this.isMusicPlaying = false;
        });
    }
  }

  public startMusic(resetTime: boolean = true) {
    if (this.currentTrack === 'battle') {
      this.playBattleMusic(resetTime);
    } else {
      this.playTitleMusic(resetTime);
    }
  }

  public stopMusic() {
    if (this.titleAudio) {
      this.titleAudio.pause();
    }
    if (this.battleAudio) {
      this.battleAudio.pause();
    }
    this.isMusicPlaying = false;
  }
}

export const sounds = new SoundManager();
