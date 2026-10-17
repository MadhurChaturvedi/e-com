const MUTE_STORAGE_KEY = 'novastore_sound_muted';
const EVENT_MUTE_CHANGE = 'novastore_sound_mute_changed';

class OrderSoundService {
  constructor() {
    this.audioCtx = null;
    this.isMutedState = this._readMutePreference();
    this._initAutoplayUnlock();
  }

  _readMutePreference() {
    try {
      if (typeof window === 'undefined') return false;
      const stored = localStorage.getItem(MUTE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }

  _initAutoplayUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      try {
        if (!this.audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            this.audioCtx = new AudioContextClass();
          }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
      } catch (err) {
        // Silently ignore browser audio context blocks
      } finally {
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      }
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  isMuted() {
    return this.isMutedState;
  }

  setMuted(muted) {
    this.isMutedState = Boolean(muted);
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify(this.isMutedState));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_MUTE_CHANGE, { detail: { muted: this.isMutedState } }));
      }
    } catch {}
    return this.isMutedState;
  }

  toggleMute() {
    return this.setMuted(!this.isMutedState);
  }

  onMuteChange(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e.detail.muted);
    window.addEventListener(EVENT_MUTE_CHANGE, handler);
    return () => window.removeEventListener(EVENT_MUTE_CHANGE, handler);
  }

  /**
   * Customer Friendly Order Confirmation Chime:
   * Two-tone ascending chime (C5 523Hz -> G5 784Hz) with warm harmonics, under 0.5s.
   */
  playOrderPlacedSound() {
    if (this.isMuted()) return;

    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.45, now);
      masterGain.connect(ctx.destination);

      // Tone 1: 523.25 Hz (C5) for 120ms
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Tone 2: 783.99 Hz (G5) for 260ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.5, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback fails gracefully without throwing
    }
  }

  /**
   * Admin / Seller New Order Notification Buzzer/Chime:
   * Double alert chirp (659Hz -> 880Hz) to notify admin when an incoming order arrives.
   */
  playNewOrderNotificationSound() {
    if (this.isMuted()) return;

    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.5, now);
      masterGain.connect(ctx.destination);

      [
        { freq: 659.25, start: 0, duration: 0.12 },
        { freq: 880.00, start: 0.14, duration: 0.25 },
      ].forEach(({ freq, start, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; // Crisp alert tone
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.45, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + start);
        osc.stop(now + start + duration + 0.05);
      });
    } catch {}
  }
}

export const orderSound = new OrderSoundService();
export default orderSound;
