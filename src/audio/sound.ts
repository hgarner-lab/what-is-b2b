/**
 * Tiny synthesised sound kit. Everything is generated with the Web Audio API,
 * so there are no audio files to load and nothing plays until the player
 * has interacted with the page.
 */

type Wave = OscillatorType;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function audio(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  {
    at = 0,
    dur = 0.12,
    type = 'square' as Wave,
    vol = 0.5,
    slideTo,
  }: { at?: number; dur?: number; type?: Wave; vol?: number; slideTo?: number } = {},
) {
  const ac = audio();
  if (!ac || !master) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sound = {
  setEnabled(on: boolean) {
    enabled = on;
    if (!on && ctx && ctx.state === 'running') void ctx.suspend();
    if (on && ctx && ctx.state === 'suspended') void ctx.resume();
  },
  /** Call from a user gesture so browsers allow audio. */
  unlock() {
    audio();
  },
  click() {
    tone(660, { dur: 0.05, type: 'triangle', vol: 0.35 });
  },
  appear() {
    tone(320, { dur: 0.12, type: 'triangle', vol: 0.35, slideTo: 520 });
  },
  hit() {
    tone(520, { dur: 0.07, type: 'square', vol: 0.3 });
    tone(880, { at: 0.05, dur: 0.1, type: 'square', vol: 0.25 });
  },
  success() {
    [523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.06, dur: 0.14, type: 'square', vol: 0.28 }));
  },
  uhoh() {
    tone(300, { dur: 0.14, type: 'triangle', vol: 0.35, slideTo: 220 });
  },
  tick() {
    tone(1200, { dur: 0.025, type: 'square', vol: 0.08 });
  },
  rotate() {
    tone(900, { dur: 0.04, type: 'triangle', vol: 0.18 });
  },
  land() {
    tone(140, { dur: 0.09, type: 'triangle', vol: 0.45, slideTo: 90 });
  },
  lineClear() {
    [392, 523, 659, 1046].forEach((f, i) => tone(f, { at: i * 0.05, dur: 0.12, type: 'square', vol: 0.26 }));
  },
  brick(layer: number) {
    const base = [440, 554, 659][layer] ?? 440;
    tone(base, { dur: 0.08, type: 'square', vol: 0.3 });
  },
  wall() {
    tone(220, { dur: 0.04, type: 'triangle', vol: 0.2 });
  },
  milestone() {
    [659, 880].forEach((f, i) => tone(f, { at: i * 0.08, dur: 0.16, type: 'triangle', vol: 0.35 }));
  },
  coin() {
    tone(988, { dur: 0.08, type: 'square', vol: 0.3 });
    tone(1319, { at: 0.08, dur: 0.35, type: 'square', vol: 0.3 });
  },
  ready() {
    tone(523, { dur: 0.1, type: 'square', vol: 0.25 });
  },
  go() {
    tone(784, { dur: 0.08, type: 'square', vol: 0.3 });
    tone(1046, { at: 0.08, dur: 0.22, type: 'square', vol: 0.3 });
  },
  combo(n: number) {
    const base = 660 + Math.min(n, 6) * 90;
    tone(base, { dur: 0.06, type: 'square', vol: 0.25 });
    tone(base * 1.5, { at: 0.06, dur: 0.1, type: 'square', vol: 0.25 });
  },
  countdown() {
    tone(440, { dur: 0.08, type: 'square', vol: 0.22 });
  },
  levelClear() {
    const notes = [523, 523, 523, 659, 784, 659, 784, 1046];
    const at = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.7, 0.85];
    notes.forEach((f, i) => tone(f, { at: at[i], dur: i === notes.length - 1 ? 0.5 : 0.1, type: 'square', vol: 0.24 }));
    tone(131, { at: 0.85, dur: 0.5, type: 'triangle', vol: 0.4 });
  },
  zoom() {
    tone(200, { dur: 0.5, type: 'triangle', vol: 0.3, slideTo: 1600 });
  },
  win() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((f, i) => tone(f, { at: i * 0.09, dur: 0.22, type: 'square', vol: 0.24 }));
    tone(261, { at: 0.36, dur: 0.9, type: 'triangle', vol: 0.4 });
    tone(392, { at: 0.36, dur: 0.9, type: 'triangle', vol: 0.3 });
  },
};
