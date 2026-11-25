// The sound effects, made here with Web Audio, as in Off by One: oscillators and filtered noise, through a little
// reverb, for space. No files: nothing to license, and nothing to load. A plain module, so the audition page
// (scripts/sfx.html, from the dev server) plays and measures the same sounds. sound.svelte.js plays them in the game,
// with SFX On/Off.

// All the voices' volumes are scaled by this, keeping their balance, against the music at 0.4. They were balanced by
// the audition page's loudness: an ending near -19 dB, a turn, flip or page about -25 to -29, a mark -25, a click -40.
const SFX_VOLUME = 2.5;

// how long the reverb rings, in seconds
const TAIL = 2.4;

// The parts a sound is made of, for one context: the live one, or an offline one the audition page renders into.
// Everything goes to `out`: dry, and some of it (wet) through the reverb.
const kitFor = (ctx) => {
	const out = ctx.createGain();
	out.gain.value = SFX_VOLUME;

	// a soft limiter, so that sounds landing together can't clip
	const limit = ctx.createDynamicsCompressor();
	limit.threshold.value = -6;
	limit.knee.value = 6;
	limit.ratio.value = 12;
	limit.attack.value = 0.002;
	limit.release.value = 0.15;
	out.connect(limit).connect(ctx.destination);

	// the reverb: two channels of noise dying away, a little apart, so it spreads
	const rate = ctx.sampleRate;
	const impulse = ctx.createBuffer(2, Math.round(TAIL * rate), rate);

	for (let ch = 0; ch < 2; ch++) {
		const data = impulse.getChannelData(ch);

		for (let i = 0; i < data.length; i++) {
			data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 4;
		}
	}

	const reverb = ctx.createConvolver();
	reverb.buffer = impulse;
	reverb.connect(out);

	// two seconds of white noise, for whooshes, played from a random point
	const noiseBuffer = ctx.createBuffer(1, rate * 2, rate);
	const nd = noiseBuffer.getChannelData(0);

	for (let i = 0; i < nd.length; i++) {
		nd[i] = Math.random() * 2 - 1;
	}

	// at: seconds from now; vol: the peak, reached after attack, from which it dies away over the rest of dur;
	// pan: -1 left to 1 right, moving to panTo; wet: how much goes through the reverb
	const envelope = ({ at, dur, vol, attack, pan = 0, panTo = pan, wet = 0.2 }) => {
		const t = ctx.currentTime + at;
		const g = ctx.createGain();

		g.gain.setValueAtTime(0, t);
		g.gain.linearRampToValueAtTime(vol, t + attack);
		g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));

		const p = ctx.createStereoPanner();
		p.pan.setValueAtTime(pan, t);
		p.pan.linearRampToValueAtTime(panTo, t + dur);
		g.connect(p).connect(out);

		if (wet) {
			const send = ctx.createGain();
			send.gain.value = wet;
			p.connect(send).connect(reverb);
		}

		return { g, t, end: t + dur + 0.05 };
	};

	// a frequency gliding from f to mid (by attack, if mid is given) and on to `to` (by glide, or the end)
	const sweep = (param, t, { f, mid, to = f, attack, glide, dur }) => {
		param.setValueAtTime(f, t);

		if (mid) {
			param.exponentialRampToValueAtTime(mid, t + attack);
		}

		if (to !== (mid ?? f)) {
			param.exponentialRampToValueAtTime(to, t + (glide ?? dur));
		}
	};

	// a note: f, gliding to `to`; type: the oscillator's wave
	const tone = ({ f, mid, to, glide, type = 'sine', dur, vol = 0.05, at = 0, attack = 0.004, pan, panTo, wet }) => {
		const { g, t, end } = envelope({ at, dur, vol, attack, pan, panTo, wet });
		const o = ctx.createOscillator();

		o.type = type;
		sweep(o.frequency, t, { f, mid, to, attack, glide, dur });
		o.connect(g);
		o.start(t);
		o.stop(end);
	};

	// a rush of noise through a band-pass filter, its centre gliding as a tone's would; q: how narrow the band
	const noise = ({ f, mid, to, glide, q = 1.2, dur, vol = 0.05, at = 0, attack = dur / 2, pan, panTo, wet }) => {
		const { g, t, end } = envelope({ at, dur, vol, attack, pan, panTo, wet });
		const src = ctx.createBufferSource();
		const bp = ctx.createBiquadFilter();

		src.buffer = noiseBuffer;
		src.loop = true;
		bp.type = 'bandpass';
		bp.Q.value = q;
		sweep(bp.frequency, t, { f, mid, to, attack, glide, dur });
		src.connect(bp).connect(g);
		src.start(t, Math.random() * 1.5);
		src.stop(end);
	};

	// a bell: a note with a fainter, inharmonic partial over it
	const bell = ({ f, vol = 0.05, ...rest }) => {
		tone({ f, vol, type: 'triangle', ...rest });
		tone({ f: f * 2.76, vol: vol * 0.25, ...rest, dur: (rest.dur ?? 0.3) * 0.5 });
	};

	return { tone, noise, bell };
};

// The notes, by name. Tuned to the music, which is open fifths on C, F, D and G with no thirds: its notes are C, D, F
// and G (a little B flat and E flat), and hardly any E, A, B or F sharp. So the pitched sounds keep to those four, and
// the one third, the minor chord's E flat, is a note the music has.
const C5 = 523.25;
const D5 = 587.33;
const Eb5 = 622.25;
const F5 = 698.46;
const G5 = 783.99;
const C6 = 1046.5;
const D6 = 1174.66;
const F6 = 1396.91;
const G6 = 1567.98;
const C7 = 2093;
const D7 = 2349.32;
const G7 = 3135.96;

// a planet's note: the small one high, the giant low
const PLANET_NOTE = [0, D6, G5, C5];

// money going out: a coin, two notes down
const coin = (k, at = 0) => {
	k.bell({ f: C7, dur: 0.12, vol: 0.06, at, wet: 0.25 });
	k.bell({ f: G6, dur: 0.18, vol: 0.06, at: at + 0.065, wet: 0.25 });
};

// a planet put on the map: a drop, falling onto its note, deeper and longer the bigger it is
const place = (k, v, at = 0, vol = 1) => {
	const f = PLANET_NOTE[v];

	k.tone({ f: f * 1.6, to: f, glide: 0.03, dur: 0.3 + v * 0.1, vol: 0.11 * vol, at, wet: 0.35 });
	k.tone({ f: f * 2, dur: 0.12, vol: 0.025 * vol, at: at + 0.01, wet: 0.35 });

	if (v === 3) {
		k.tone({ f: f / 2, dur: 0.4, vol: 0.05 * vol, at, wet: 0.2 });
	}
};

// a planet taken off the map: a pop, up and away
const unplace = (k, at = 0, vol = 1) => {
	k.tone({ f: 700, to: 1600, glide: 0.08, dur: 0.11, vol: 0.06 * vol, at, wet: 0.25 });
	k.noise({ f: 3000, to: 6000, q: 2, dur: 0.08, vol: 0.05 * vol, at, attack: 0.01, wet: 0.1 });
};

// a chord's notes struck together, as bells
const chord = (k, notes, at, dur, vol) => notes.forEach((f) => k.bell({ f, dur, vol, at, wet: 0.5 }));

// Each voice takes the kit, then what the call passed. Times in seconds; the game's in ms are passed as they are.
export const voices = {
	// a button pressed: a soft glassy click
	tap: (k) => {
		k.tone({ f: 1800, to: 1400, dur: 0.035, type: 'triangle', vol: 0.2, wet: 0.05 });
		k.tone({ f: 3600, dur: 0.012, vol: 0.05, wet: 0 });
	},

	// SFX or Music on (up) or off (down): two notes, as Off by One's checkbox
	toggle: (k, on = true) => {
		k.tone({ f: on ? G5 : C6, dur: 0.05, type: 'triangle', vol: 0.08, wet: 0.15 });
		k.tone({ f: on ? C6 : G5, dur: 0.07, type: 'triangle', vol: 0.07, at: 0.05, wet: 0.15 });
	},

	// a cell selected, its palette growing out of it: a ping, rising
	select: (k) => {
		k.tone({ f: G5, to: D6, glide: 0.05, dur: 0.2, vol: 0.1, wet: 0.3 });
		k.tone({ f: D7, dur: 0.08, vol: 0.018, at: 0.04, wet: 0.3 });
	},

	// a cell let go, its palette going: the ping, falling
	deselect: (k) => {
		k.tone({ f: D6, to: G5, glide: 0.05, dur: 0.13, vol: 0.09, wet: 0.2 });
	},

	// the keyboard's cursor moving a cell, or a swipe passing the point where it would settle on the next side
	tick: (k) => {
		k.tone({ f: 2200, dur: 0.022, type: 'triangle', vol: 0.1, wet: 0.05 });
	},

	// the cursor put away
	tock: (k) => {
		k.tone({ f: 1500, to: 1100, dur: 0.04, type: 'triangle', vol: 0.1, wet: 0.05 });
	},

	// nothing doing: the cursor at the map's edge, a turn while one is under way, a palette's spent swatch
	bump: (k) => {
		k.tone({ f: 190, to: 120, dur: 0.11, type: 'triangle', vol: 0.14, wet: 0.05 });
	},

	// a planet marked on a cell, v its size; it was blank, so it's free
	place: (k, v) => place(k, v),

	// a cell changed: another planet, or cleared (v 0); either costs
	change: (k, v) => {
		if (v) {
			place(k, v);
		} else {
			unplace(k);
		}

		coin(k, 0.09);
	},

	// Clear All: a sweep down the map, and a coin for each planet cleared (the first few)
	clearAll: (k, n = 1) => {
		k.noise({ f: 2500, mid: 1200, to: 350, q: 1.4, dur: 0.45, attack: 0.05, vol: 0.09, wet: 0.3 });

		for (let i = 0; i < Math.min(n, 6); i++) {
			coin(k, 0.12 + i * 0.09);
		}
	},

	// a turn's charge, as it lands on another side
	coin: (k) => coin(k),

	// The board turning, over ms: air rushing past, swelling and dying away as the lineup leaves and the next comes in,
	// moving across the way the lineups slide (dir 1, clockwise: right to left); a half turn's lower and longer.
	turn: (k, ms = 500, dir = 1, half = false) => {
		const dur = ms / 1000 + 0.12;

		k.noise({
			f: half ? 250 : 350,
			mid: half ? 1100 : 1400,
			to: 300,
			q: 1.5,
			dur,
			attack: dur * 0.5,
			vol: 0.14,
			pan: 0.55 * dir,
			panTo: -0.55 * dir,
			wet: 0.25
		});
		k.tone({ f: half ? F5 / 8 : G5 / 8, to: C6 / 8, dur, attack: dur * 0.5, vol: 0.035, wet: 0.1 });
	},

	// a swipe let go short of a turn, the board easing back to the side it was on
	settle: (k) => {
		k.noise({ f: 900, mid: 600, to: 300, q: 1.5, dur: 0.28, attack: 0.04, vol: 0.14, wet: 0.2 });
	},

	// The map flipping away, over ms, to edge-on: a rising rush, ending in a glint as only its gold edge shows.
	flipAway: (k, ms = 500) => {
		const s = ms / 1000;

		k.noise({ f: 300, mid: 1600, to: 1800, q: 1.3, dur: s + 0.08, attack: s * 0.85, vol: 0.13, wet: 0.25 });
		k.tone({ f: 196, to: 392, glide: s, dur: s + 0.08, attack: s * 0.85, type: 'triangle', vol: 0.04, wet: 0.2 });
		k.bell({ f: D7, dur: 0.5, vol: 0.03, at: s, wet: 0.6 });
	},

	// The map flipping back to flat, over ms: a falling rush, and a soft thud as it lies down.
	flipBack: (k, ms = 500) => {
		const s = ms / 1000;

		k.noise({ f: 1800, mid: 900, to: 280, q: 1.3, dur: s + 0.05, attack: s * 0.3, vol: 0.11, wet: 0.25 });
		k.tone({ f: 392, to: 196, glide: s, dur: s, attack: s * 0.3, type: 'triangle', vol: 0.04, wet: 0.2 });
		k.tone({ f: 130, to: 65, dur: 0.22, at: s, vol: 0.08, wet: 0.2 });
	},

	// the tray's planets growing in, a new puzzle's or a game's coming back: a shimmer, rising
	rise: (k) => {
		[C6, D6, F6, G6, C7].forEach((f, i) => k.tone({ f, dur: 0.6, vol: 0.03, at: i * 0.085, attack: 0.02, wet: 0.6 }));
	},

	// A page pushing another, over ms: a broad rush moving across, the way the pages go (way 1: going on, from the right;
	// -1: Back, from the left), a little higher going on.
	slide: (k, ms = 500, way = 1) => {
		const dur = ms / 1000 + 0.15;

		k.noise({
			f: 200,
			mid: way > 0 ? 800 : 600,
			to: 220,
			q: 0.9,
			dur,
			attack: dur * 0.45,
			vol: 0.18,
			pan: 0.5 * way,
			panTo: -0.5 * way,
			wet: 0.2
		});
	},

	// the shortcuts card sliding in from the right (with a chime), or back out
	card: (k, shown = true) => {
		k.noise({
			f: 400,
			mid: 1400,
			to: 500,
			q: 1.2,
			dur: 0.5,
			attack: 0.22,
			vol: 0.08,
			pan: shown ? 0.5 : 0,
			panTo: shown ? 0 : 0.5,
			wet: 0.2
		});

		if (shown) {
			k.bell({ f: G6, dur: 0.4, vol: 0.03, at: 0.3, wet: 0.5 });
		}
	},

	// a question coming up (Give Up, Clear All, Reset Stats): two notes, asking
	question: (k) => {
		k.noise({ f: 500, mid: 1200, to: 400, dur: 0.4, attack: 0.18, vol: 0.04, pan: 0.4, panTo: 0, wet: 0.1 });
		k.tone({ f: D5, dur: 0.14, type: 'triangle', vol: 0.07, at: 0.05, wet: 0.3 });
		k.tone({ f: G5, dur: 0.26, type: 'triangle', vol: 0.07, at: 0.15, wet: 0.3 });
	},

	// No: the two notes back down
	dismiss: (k) => {
		k.tone({ f: G5, dur: 0.12, type: 'triangle', vol: 0.06, wet: 0.3 });
		k.tone({ f: D5, dur: 0.22, type: 'triangle', vol: 0.06, at: 0.1, wet: 0.3 });
	},

	// Play new (or the daily's countdown) coming in after the game-over message: a soft chime
	ready: (k) => {
		k.noise({ f: 500, mid: 1200, to: 400, dur: 0.4, attack: 0.18, vol: 0.04, pan: 0.4, panTo: 0, wet: 0.1 });
		k.bell({ f: C6, dur: 0.7, vol: 0.045, at: 0.15, wet: 0.5 });
		k.bell({ f: G6, dur: 0.6, vol: 0.025, at: 0.21, wet: 0.5 });
	},

	// The map solved, its planets swelling three times (half a second each): a note at each swell's height, rising, then
	// a chord. kind: 'best' or 'average' (improved) add a sparkle; 'broke' (into the red) shifts the chord into a minor.
	// The chord is open (C, G, C and a D over them), with no third, so it sits with any of the music's chords; a major
	// one's E ground a semitone against the music's F.
	win: (k, kind = 'won') => {
		[
			[C5, F5],
			[D5, G5],
			[G5, C6]
		].forEach((notes, i) => chord(k, notes, 0.25 + i * 0.5, 0.45, 0.05));

		chord(k, kind === 'broke' ? [C5, Eb5, G5, C6] : [C5, G5, C6, D6], 1.5, 1.6, 0.05);

		const sparkle = { best: [G6, C7, D7, G7], average: [G6, C7] }[kind] ?? [];

		sparkle.forEach((f, i) => k.bell({ f, dur: 0.5, vol: 0.025, at: 1.65 + i * 0.08, wet: 0.6 }));
	},

	// Given up: a sigh, down; then, as the map changes over, a pop for each planet marked wrong and a drop for each true
	// one, at their cells' times (in seconds). outs: those times; ins: [time, size] pairs.
	lost: (k, outs = [], ins = []) => {
		k.tone({ f: G5 / 2, to: C5 / 2, glide: 0.6, dur: 1, type: 'triangle', vol: 0.08, attack: 0.02, wet: 0.4 });
		k.tone({ f: G5 / 4, to: C5 / 4, glide: 0.6, dur: 1, vol: 0.06, attack: 0.02, wet: 0.3 });
		outs.forEach((at) => unplace(k, at, 0.5));
		ins.forEach(([at, v]) => place(k, v, at, 0.6));
	},

	// Reset Stats done, or the splash tapped (which wipes the saves): a sweep, all the way down
	reset: (k) => {
		k.tone({ f: 1600, to: 180, glide: 0.4, dur: 0.45, type: 'triangle', vol: 0.06, wet: 0.3 });
		k.noise({ f: 2200, to: 300, q: 1.2, dur: 0.4, attack: 0.02, vol: 0.06, wet: 0.2 });
	},

	// Share: copied (two bright notes, up), or not (a bump, twice)
	copied: (k, ok = true) => {
		if (ok) {
			k.bell({ f: D6, dur: 0.18, vol: 0.05, wet: 0.3 });
			k.bell({ f: G6, dur: 0.3, vol: 0.05, at: 0.09, wet: 0.3 });
		} else {
			[0, 0.13].forEach((at) => k.tone({ f: 190, to: 120, dur: 0.11, type: 'triangle', vol: 0.1, at, wet: 0.05 }));
		}
	}
};

// ---------- playing them ----------

let ac = null;
let kit = null;

// The context starts on a tap or a key, as browsers require; till then, and while it's suspended, nothing plays (a
// sound queued then would play late, all at once, when it woke).
export function wakeAudio() {
	if (!ac) {
		try {
			ac = new (window.AudioContext || window.webkitAudioContext)();
			kit = kitFor(ac);
		} catch {
			ac = null;
		}
	}

	if (ac && ac.state !== 'running') {
		ac.resume().catch(() => {});
	}
}

// a bump at most this often: a key held down repeats
const BUMP_MS = 150;
let lastBump = 0;

export function play(name, ...args) {
	if (!kit || ac.state !== 'running') {
		return;
	}

	if (name === 'bump') {
		const now = performance.now();

		if (now - lastBump < BUMP_MS) {
			return;
		}

		lastBump = now;
	}

	voices[name](kit, ...args);
}

// A voice rendered offline, for the audition page to play and measure: an AudioBuffer, long enough for its tail.
export async function render(name, args = [], seconds = 3.5) {
	const rate = 44100;
	const ctx = new OfflineAudioContext(2, Math.round(seconds * rate), rate);

	voices[name](kitFor(ctx), ...args);
	return ctx.startRendering();
}
