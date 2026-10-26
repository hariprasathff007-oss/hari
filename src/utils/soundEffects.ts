/**
 * Web Audio API synthesized sound generator
 * Guarantees zero-network audio feedback for destination alarm, bus horn, and alerts.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBusHorn(volume: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Dual air horn frequencies commonly heard on TNSTC / SETC buses (approx 440Hz & 554Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(554, now);

    // Beep pattern: beep - small gap - long beep
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.18);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.65);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);

    if ('vibrate' in navigator) {
      navigator.vibrate([150, 80, 400]);
    }
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}

export function playAlarmSound(type: 'horn' | 'chime' | 'train' | 'bell', volume: number = 0.8) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'horn') {
      playBusHorn(volume);
      return;
    }

    if (type === 'train') {
      // Pleasant dual tone chime (G4 -> C5 -> E5 -> G5)
      const freqs = [392, 523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.18;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume * 0.4, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
      return;
    }

    if (type === 'bell') {
      // Station brass bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);

      gain.gain.setValueAtTime(volume * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.25);
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }
      return;
    }

    // Default 'chime' - repeating urgent wake-up ringtone
    const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume * 0.45, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([250, 100, 250, 100, 500]);
    }
  } catch (err) {
    console.warn('Audio playback error', err);
  }
}
