// utils.js — Shared utility functions for FlagMaster

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 * @param {Array} array
 * @returns {Array}
 */
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a flagcdn.com image URL for a given ISO-3166-1 alpha-2 country code.
 * @param {string} code  e.g. 'gb', 'us'
 * @returns {string}
 */
function flagUrl(code) {
  return `https://flagcdn.com/w160/${code}.png`;
}

/**
 * Format a duration in seconds as mm:ss.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Read a JSON value from localStorage.
 * Returns null on missing key or parse error.
 * @param {string} key
 * @returns {*}
 */
function storageGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Write a JSON-serialisable value to localStorage.
 * @param {string} key
 * @param {*} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private browsing — fail silently.
  }
}

/**
 * Safely escape a string for insertion into HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

// ============================================================
// Web Audio — Sound Effects (no external files needed)
// ============================================================

let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

/**
 * Play a simple synthesized tone.
 * @param {number[]} freqs     Array of frequencies to play in sequence (Hz)
 * @param {number}   duration  Duration of each note in seconds
 * @param {string}   type      Oscillator type: 'sine' | 'square' | 'triangle' | 'sawtooth'
 * @param {number}   volume    0–1
 */
function playTone(freqs, duration = 0.12, type = 'sine', volume = 0.18) {
  try {
    const ctx = getAudioCtx();
    freqs.forEach((freq, i) => {
      const osc   = ctx.createOscillator();
      const gain  = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type      = type;
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * (duration * 0.95);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration + 0.01);
    });
  } catch (_) { /* audio blocked — fail silently */ }
}

const Sounds = {
  /** Pair matched successfully */
  match:        () => playTone([523, 659, 784], 0.1, 'sine',     0.15),
  /** Pair flipped but no match */
  mismatch:     () => playTone([220, 180],       0.14, 'triangle', 0.12),
  /** All pairs found — game won */
  win:          () => playTone([523, 659, 784, 1047], 0.12, 'sine', 0.18),
  /** Quiz answer correct */
  quizCorrect:  () => playTone([659, 784, 1047], 0.09, 'sine',     0.14),
  /** Quiz answer wrong */
  quizWrong:    () => playTone([311, 233],        0.18, 'sawtooth', 0.1),
  /** Flashcard marked as known */
  known:        () => playTone([523, 659],        0.1,  'sine',     0.13),
  /** Flashcard marked as unknown */
  unknown:      () => playTone([330, 277],        0.12, 'triangle', 0.1),
};
