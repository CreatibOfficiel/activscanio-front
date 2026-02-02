class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private currentlyPlaying: string | null = null;
  private volume: number = 1;
  private onPlayingChange: ((id: string | null) => void) | null = null;

  setOnPlayingChange(callback: (id: string | null) => void) {
    this.onPlayingChange = callback;
  }

  preload(id: string, url: string): void {
    if (typeof window === 'undefined') return;

    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = this.volume;

    audio.addEventListener('ended', () => {
      if (this.currentlyPlaying === id) {
        this.currentlyPlaying = null;
        this.onPlayingChange?.(null);
      }
    });

    this.sounds.set(id, audio);
  }

  play(id: string): void {
    this.stopAll();

    const audio = this.sounds.get(id);
    if (audio) {
      audio.currentTime = 0;
      audio.volume = this.volume;
      audio.play().catch(console.error);
      this.currentlyPlaying = id;
      this.onPlayingChange?.(id);
    }
  }

  stop(id: string): void {
    const audio = this.sounds.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      if (this.currentlyPlaying === id) {
        this.currentlyPlaying = null;
        this.onPlayingChange?.(null);
      }
    }
  }

  stopAll(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentlyPlaying = null;
    this.onPlayingChange?.(null);
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  getVolume(): number {
    return this.volume;
  }

  isPlaying(id: string): boolean {
    return this.currentlyPlaying === id;
  }

  getCurrentlyPlaying(): string | null {
    return this.currentlyPlaying;
  }

  cleanup(): void {
    this.stopAll();
    this.sounds.clear();
    this.onPlayingChange = null;
  }
}

export const audioManager = new AudioManager();
