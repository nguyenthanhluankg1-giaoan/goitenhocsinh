import { GameSettingsConfig } from '../types/game';

/**
 * AudioManager handles all procedural Web Audio API sound effects and
 * Vietnamese Web Speech API (speechSynthesis) announcements safely.
 */
class AudioManagerService {
  private ctx: AudioContext | null = null;
  private hasUserInteracted = false;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private hoverLoopTimer: ReturnType<typeof setInterval> | null = null;
  private voicesLoaded = false;
  private cachedVietnameseVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          this.voicesLoaded = true;
          this.cachedVietnameseVoice = this.findBestVietnameseVoice(voices);
        }
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  private findBestVietnameseVoice(
    voices: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice | null {
    // Priority 1: Exact vi-VN or vi_VN natural/Google/Microsoft voices
    const viVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt')
    );
    if (viVoices.length === 0) return null;

    const preferred = viVoices.find(
      (v) =>
        v.name.includes('Google') ||
        v.name.includes('HoaiMy') ||
        v.name.includes('NamMinh') ||
        v.name.includes('Natural') ||
        v.default
    );
    return preferred || viVoices[0];
  }

  public unlockAudioByUserGesture(): void {
    this.hasUserInteracted = true;
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore audio context errors in restricted environments
    }
  }

  public hasVietnameseVoiceSupport(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }
    if (!this.voicesLoaded) {
      const voices = window.speechSynthesis.getVoices();
      this.cachedVietnameseVoice = this.findBestVietnameseVoice(voices);
    }
    return this.cachedVietnameseVoice !== null;
  }

  /**
   * Speaks a Vietnamese phrase cleanly, cancelling any previous utterance so voices never overlap.
   */
  public speakVietnamese(
    text: string,
    settings: GameSettingsConfig,
    onEnd?: () => void
  ): void {
    if (!this.hasUserInteracted || !settings.voiceEnabled || !settings.soundEnabled) {
      if (onEnd) onEnd();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.volume = Math.max(0, Math.min(1, settings.voiceVolume));
      utterance.rate = Math.max(0.6, Math.min(1.5, settings.voiceRate));
      utterance.pitch = 1.08;

      const voices = window.speechSynthesis.getVoices();
      const bestVi = this.cachedVietnameseVoice || this.findBestVietnameseVoice(voices);
      if (bestVi) {
        utterance.voice = bestVi;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stopAllSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  public stopAllAudio(): void {
    this.stopAllSpeech();
    if (this.hoverLoopTimer) {
      clearInterval(this.hoverLoopTimer);
      this.hoverLoopTimer = null;
    }
    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.activeOscillators.clear();
  }

  private createTone(
    freqStart: number,
    freqEnd: number,
    durationSec: number,
    type: OscillatorType,
    gainLevel: number,
    settings: GameSettingsConfig,
    delaySec = 0
  ): void {
    if (!this.hasUserInteracted || !settings.soundEnabled || settings.sfxVolume <= 0) {
      return;
    }
    if (!this.ctx) {
      this.unlockAudioByUserGesture();
    }
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime + delaySec;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
      if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, freqEnd),
          now + durationSec
        );
      }

      const peakGain = Math.max(0.001, gainLevel * settings.sfxVolume * 0.35);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + Math.min(0.03, durationSec * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      this.activeOscillators.add(osc);
      osc.onended = () => {
        this.activeOscillators.delete(osc);
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // Ignore
        }
      };

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * 1. UFO xuất hiện: tiếng động cơ khoa học viễn tưởng
   */
  public playUfoEnter(settings: GameSettingsConfig): void {
    this.createTone(180, 680, 0.55, 'sine', 0.7, settings, 0);
    this.createTone(320, 920, 0.45, 'triangle', 0.45, settings, 0.15);
    this.createTone(880, 520, 0.35, 'sine', 0.5, settings, 0.5);
  }

  /**
   * 2. UFO bay / Quét tìm: tiếng phản lực điện tử + radar
   */
  public playRadarScanPing(settings: GameSettingsConfig): void {
    this.createTone(620, 980, 0.14, 'sine', 0.4, settings, 0);
    this.createTone(980, 740, 0.14, 'triangle', 0.3, settings, 0.15);
  }

  /**
   * 3. Khóa mục tiêu: tiếng bíp tăng dần (3... 2... 1...)
   */
  public playTargetLockBeeps(settings: GameSettingsConfig): void {
    this.createTone(520, 540, 0.12, 'square', 0.45, settings, 0.0);
    this.createTone(660, 680, 0.12, 'square', 0.5, settings, 0.22);
    this.createTone(840, 880, 0.14, 'square', 0.6, settings, 0.44);
    this.createTone(1046, 1174, 0.22, 'sawtooth', 0.65, settings, 0.66);
  }

  /**
   * 4. Bắt hụt: âm thanh hài hước "Boing!"
   */
  public playFunnyBoingMiss(settings: GameSettingsConfig): void {
    this.createTone(220, 780, 0.18, 'sine', 0.85, settings, 0);
    this.createTone(780, 190, 0.22, 'triangle', 0.75, settings, 0.16);
    this.createTone(260, 540, 0.25, 'sine', 0.65, settings, 0.35);
  }

  /**
   * 5. Bắt nhầm tín hiệu giả: âm thanh điện tử bối rối
   */
  public playConfusedFalseSignal(settings: GameSettingsConfig): void {
    const notes = [640, 580, 620, 440, 370];
    notes.forEach((freq, idx) => {
      this.createTone(freq, freq * 0.92, 0.11, 'triangle', 0.55, settings, idx * 0.11);
    });
  }

  /**
   * 6. Suýt bắt được / Tăng tốc đột ngột
   */
  public playSuddenBoost(settings: GameSettingsConfig): void {
    this.createTone(250, 1200, 0.35, 'sawtooth', 0.55, settings, 0);
    this.createTone(400, 1500, 0.3, 'sine', 0.5, settings, 0.08);
  }

  /**
   * 7. Bắt trúng: âm thanh hút năng lượng và chuông chiến thắng
   */
  public playTractorCatchBeam(settings: GameSettingsConfig): void {
    this.createTone(300, 880, 0.7, 'sine', 0.75, settings, 0);
    this.createTone(450, 1320, 0.7, 'triangle', 0.55, settings, 0.05);
  }

  /**
   * 8. Công bố tên: nhạc chiến thắng ngắn
   */
  public playVictoryRevealFanfare(settings: GameSettingsConfig): void {
    // C5 - E5 - G5 - C6 fanfare chord sequence
    const fanfare = [
      { freq: 523.25, delay: 0.0, dur: 0.16 },
      { freq: 659.25, delay: 0.14, dur: 0.16 },
      { freq: 783.99, delay: 0.28, dur: 0.18 },
      { freq: 1046.5, delay: 0.44, dur: 0.55 },
    ];
    for (const note of fanfare) {
      this.createTone(note.freq, note.freq * 1.01, note.dur, 'triangle', 0.8, settings, note.delay);
      this.createTone(note.freq * 0.5, note.freq * 0.5, note.dur, 'sine', 0.5, settings, note.delay);
    }
  }

  /**
   * 9. Hoàn thành danh sách: âm thanh chúc mừng toàn lớp
   */
  public playCycleCompletedCelebration(settings: GameSettingsConfig): void {
    const melody = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    melody.forEach((f, idx) => {
      this.createTone(f, f * 1.02, 0.22, 'triangle', 0.75, settings, idx * 0.12);
    });
  }
}

export const audioManager = new AudioManagerService();
