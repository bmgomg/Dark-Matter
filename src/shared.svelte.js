import {
	APP_STATE,
	BANK,
	COST_CHANGE,
	COST_TURN,
	FLIP_MS,
	FLIP_PAUSE_MS,
	HALF_TURN_MS,
	LEVELS,
	MSG_AVERAGE_IMPROVED,
	MSG_BEST_SCORE,
	MSG_BROKE,
	MSG_REVEALED,
	MSG_WON,
	PAGE_FADE_MS,
	PROMPT_PLAY_NEW,
	TAP_TURN_MS,
	TURN_MS
} from './const';
import { generate } from './logic';
import { _sound, sfx, tap, whoosh } from './sound.svelte';

// the side facing the player at a board angle, 0..3 (South, East, North, West)
export const sideAt = (deg) => ((Math.round(deg / 90) % 4) + 4) % 4;

export const newStats = () => ({ plays: 0, solved: 0, total: 0, best: 0 });

// pzl: the puzzle under way, per level: { N, diff, sol, marks, step, turns, changes, seen, over }
//   marks: -1 never marked, 0 cleared (both blank, which counts as empty), 1..3 a planet
//   turns, changes: what the game has cost so far, in turns and changes of mind
//   step: quarter turns clockwise so far, net (the board's angle at rest is step × 90°)
//   over: 'won' or 'revealed'
// angle: the board's angle on screen, in degrees clockwise; between steps while it turns
// rise: 1 while the horizon's spheres are still below it (a new puzzle), easing to 0
// sel: the cell being marked, [i, j], while the palette is up
// cursor: the keyboard's cell, [i, j]; cursorOn: while it shows, which only keyboard use brings about
// flip: how far the map is tilted away for a new puzzle, 0 flat to 1 edge-on
export const ss = $state({
	home: true,
	scale: 1,
	stats: newStats(),
	angle: 0,
	rise: 0,
	flip: 0
});

const keyOf = (id) => `${APP_STATE} • ${id}`;
const appKey = () => keyOf(ss.level);

// whether a puzzle has been begun: a turn made or a cell marked
const begun = (pzl) => pzl.turns > 0 || pzl.marks.some((row) => row.some((v) => v !== -1));

// whether a level has a game under way, begun and not finished
export const inProgress = (id) => {
	try {
		const pzl = JSON.parse(localStorage.getItem(keyOf(id)))?.pzl;
		return !!pzl && !pzl.over && begun(pzl);
	} catch {
		return false;
	}
};

export const _log = (value) => console.log($state.snapshot(value));

export const level = () => LEVELS.find((l) => l.id === ss.level);

export const isOver = () => !!ss.pzl?.over;

// what the game has cost so far, and what's left of the bank
export const cost = () => (ss.pzl ? ss.pzl.turns * COST_TURN + ss.pzl.changes * COST_CHANGE : 0);
export const balance = () => BANK - cost();

export const persistCommon = () => {
	const json = JSON.stringify({ sfx: _sound.sfx, music: _sound.music });
	localStorage.setItem(APP_STATE, json);
};

export const loadCommon = () => {
	const job = JSON.parse(localStorage.getItem(APP_STATE));

	if (job) {
		_sound.sfx = job.sfx;
		_sound.music = job.music;
	}
};

export const persist = () => {
	const json = JSON.stringify({ stats: ss.stats, pzl: ss.pzl });
	localStorage.setItem(appKey(), json);
};

// reduced motion: turns and risings jump straight to their end
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// out: for what's already moving (a swipe settling); a tap on an arrow turns at an even pace
const easeOut = (k) => 1 - (1 - k) ** 3;
const linear = (k) => k;

// one animation at a time per value: a new one cancels the old
const tweens = {};

const tween = (key, to, ms, done, ease = easeOut) => {
	cancelAnimationFrame(tweens[key]);

	const from = ss[key];

	if (still() || from === to) {
		ss[key] = to;
		done?.();
		return;
	}

	// The clock starts on the first frame, not now. A frame's time is when it began, which can be before now (a tap is
	// handled inside the frame), so timing from now would start a little behind 0, more so on a slow phone: the value
	// would jump back, then rush to catch up. It also leaves whatever the first frame had to do out of the time.
	let t0;

	const tick = (t) => {
		t0 ??= t;

		const k = Math.min(1, (t - t0) / ms);
		ss[key] = from + (to - from) * ease(k);

		if (k < 1) {
			tweens[key] = requestAnimationFrame(tick);
		} else {
			delete tweens[key];
			done?.();
		}
	};

	tweens[key] = requestAnimationFrame(tick);
};

// A turn to another side plays out, and is charged as it lands. Nothing can call it off once it's begun: the next side
// starts sliding in on the tray, so calling it off would be a free look.
const turnUnderWay = () => ss.target !== undefined && ss.target !== ss.pzl?.step;

export const stopTurning = () => {
	cancelAnimationFrame(tweens.angle);
	delete tweens.angle;
	delete ss.target;
	delete ss.turnFrom;
};

// what's waiting its moment: the map flipping back from edge-on, or the tray's planets rising
let pending;

const riseHorizon = (delay = 0) => {
	ss.rise = 1;
	clearTimeout(pending);
	pending = setTimeout(() => tween('rise', 0, 700), delay);
};

// whatever a flip was about to do, it won't
const stopFlip = () => {
	clearTimeout(pending);
	cancelAnimationFrame(tweens.flip);
	delete tweens.flip;
};

// the board comes to rest on a quarter turn: count the turns it took and the side now in view
const onSettled = () => {
	const pzl = ss.pzl;
	const step = Math.round(ss.angle / 90);

	ss.angle = step * 90;
	delete ss.target;
	delete ss.turnFrom;

	if (!pzl || step === pzl.step) {
		return;
	}

	// after the game, the board still turns, to look the sky over, but the turns no longer count
	if (pzl.over) {
		pzl.step = step;
		persist();
		return;
	}

	// one move, however far it went (a long drag shows nothing on the way), and free if it's come full circle
	if (sideAt(step * 90) !== sideAt(pzl.step * 90)) {
		pzl.turns += 1;
	}

	pzl.step = step;
	pzl.seen[sideAt(ss.angle)] = true;

	// the player knows how to turn the board now, whichever way they did it: the hint moves on, till the next session
	ss.swiped = true;

	persist();
};

// the board eases to rest on a quarter turn: quickly after a swipe, slowly and evenly after a tap;
// turnFrom: the angle it set off from, for the tray to slide the next lineup in over the whole of the turn
export const spinTo = (step, tapped = false, ms = tapped ? TAP_TURN_MS : TURN_MS) => {
	if (ss.target !== step && step !== ss.pzl?.step) {
		whoosh();
	}

	// released bang on the side it's turning to: a hair off it, so the next lineup, which slides in as the angle
	// closes, has some way to go
	if (ss.angle === step * 90 && step !== ss.pzl?.step) {
		ss.angle += 0.01;
	}

	ss.target = step;
	ss.turnFrom = ss.angle;
	tween('angle', step * 90, ms, onSettled, tapped ? linear : easeOut);
};

// a tap on an arrow, or ← →; dir 1: clockwise from above, so the east side comes round to the front (as a swipe to the left)
// (not while the map is flipping: a turn costs, and there would be nothing to see for it; nor over a turn under way)
export const turnBy = (dir) => {
	if (!ss.pzl || ss.flip || turnUnderWay()) {
		return;
	}

	spinTo((ss.target ?? Math.round(ss.angle / 90)) + dir, true);
};

// an arrow held, or ↑ ↓: straight to the opposite side, for the price of one turn; dir as turnBy's, the way it spins
export const turnHalf = (dir) => {
	if (!ss.pzl || ss.flip || turnUnderWay()) {
		return;
	}

	spinTo(ss.pzl.step + 2 * dir, true, HALF_TURN_MS);
};

// The map, edge-on with only its gold edge showing, flips back to flat, a pause after t0 (so a slow puzzle doesn't add
// to it). Only then do the tray's new planets rise, so the two don't move at once.
const flipBack = (t0, pause = FLIP_PAUSE_MS) => {
	clearTimeout(pending);
	pending = setTimeout(() => tween('flip', 0, FLIP_MS, () => tween('rise', 0, 700), linear), Math.max(0, pause - (performance.now() - t0)));
};

// Play new: the solved map flips a quarter turn till it's edge-on, the next puzzle is made while it can't be seen, and
// the new, empty map flips back.
export const playNew = () => {
	tween(
		'flip',
		1,
		FLIP_MS,
		async () => {
			const t0 = performance.now();
			await newPuzzle();
			flipBack(t0);
		},
		linear
	);
};

// Coming to the game page for a new puzzle: the map starts edge-on and flips back, as in the second half of Play new.
// Its pause starts as the page starts fading in, so it's seen for all of it. One dealt earlier and never touched is
// still new to the player: the launcher offers it under Start.
const arriveEdgeOn = async () => {
	const t0 = performance.now();

	stopFlip();
	ss.flip = 1;
	ss.rise = 1;

	if (!ss.pzl || ss.pzl.over) {
		await newPuzzle();
	}

	flipBack(t0, PAGE_FADE_MS + FLIP_PAUSE_MS);
};

// the new planets stay down till the map has flipped back (flipBack)
export const newPuzzle = async () => {
	const { N, diff } = level();
	const id = ss.level;

	ss.generating = true;
	delete ss.prompt;
	delete ss.message;

	const sol = await generate(N, diff);

	// the player may have gone to another level meanwhile
	if (id !== ss.level) {
		return;
	}

	delete ss.generating;
	delete ss.sel;
	delete ss.cursor;
	delete ss.cursorOn;
	stopTurning();

	ss.angle = 0;
	ss.pzl = {
		N,
		diff,
		sol,
		marks: Array.from({ length: N }, () => Array(N).fill(-1)),
		step: 0,
		turns: 0,
		changes: 0,
		seen: [true, false, false, false]
	};

	sfx('draw', 1.4, 0.5);
	ss.rise = 1;
	persist();
};

// a level's saved game goes on unless it was finished; each level keeps its own stats
export const onPlay = (id) => {
	const changed = id !== ss.level;

	if (changed) {
		ss.level = id;
		delete ss.pzl;
		delete ss.prompt;
		delete ss.message;
		delete ss.sel;
		delete ss.cursor;

		const job = JSON.parse(localStorage.getItem(appKey()));
		ss.stats = job?.stats ?? newStats();

		if (job?.pzl && !job.pzl.over) {
			ss.pzl = job.pzl;
			ss.angle = job.pzl.step * 90;
		}
	}

	if (ss.pzl && !ss.pzl.over && begun(ss.pzl)) {
		// a game resumed: the map is simply there, flat
		stopFlip();
		ss.flip = 0;

		if (changed || ss.rise) {
			riseHorizon(400);
		}
	} else {
		arriveEdgeOn();
	}

	if (!_sound.musicPlayed) {
		_sound.playMusic();
	}

	delete ss.home;
};

// a tap on a cell picks it for marking and brings up the palette; a tap on it again puts the palette away
export const select = (i, j) => {
	if (!ss.pzl || ss.pzl.over || ss.flip) {
		return;
	}

	tap();
	ss.cursor = [i, j];

	if (ss.sel?.[0] === i && ss.sel?.[1] === j) {
		delete ss.sel;
	} else {
		ss.sel = [i, j];
	}
};

export const deselect = () => delete ss.sel;

// The board as the keyboard plays it: the map is one Tab stop, with a cursor on one of its cells. It remembers its cell
// (a tap moves it too), and it starts in the corner at the screen's top left. It's for the keyboard only: it shows when
// the keyboard brings focus to the map or moves it, and goes when the focus goes or a pointer comes down on the map.
// The cursor's cell turns with the board, but it moves by the screen: up is up, however the board has turned.
const canPlay = () => ss.pzl && !ss.pzl.over && !ss.flip && !ss.prompt;

export const showCursor = () => {
	if (!canPlay()) {
		return;
	}

	if (ss.sel) {
		ss.cursor = ss.sel;
	} else if (!ss.cursor) {
		const far = ss.pzl.N - 1;
		ss.cursor = [
			[0, 0],
			[far, 0],
			[far, far],
			[0, far]
		][sideAt(ss.angle)];
	}

	ss.cursorOn = true;
};

export const hideCursor = () => delete ss.cursorOn;

// dx, dy: a cell's move on screen. The first key only shows the cursor, where it is. An open palette goes along.
export const moveCursor = (dx, dy) => {
	if (!canPlay()) {
		return;
	}

	if (!ss.cursorOn) {
		showCursor();
		return;
	}

	// the screen's move, turned back by the board's quarter turns (the one it's heading for, if it's turning)
	const [c, s] = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1]
	][sideAt((ss.target ?? ss.angle / 90) * 90)];
	const limit = (v) => Math.max(0, Math.min(ss.pzl.N - 1, v));
	const i = limit(ss.cursor[0] - dx * s + dy * c);
	const j = limit(ss.cursor[1] + dx * c + dy * s);

	ss.cursor = [i, j];

	if (ss.sel) {
		ss.sel = [i, j];
	}
};

// Enter or Space on the map: the cursor's cell, its palette up, or down
export const selectCursor = () => {
	if (canPlay() && ss.cursorOn) {
		select(...ss.cursor);
	}
};

// a key's mark, 0 to clear: on the selected cell, or else on the cursor's, straight off, at the same price
export const markCursor = (v) => {
	if (ss.sel) {
		mark(v);
	} else if (canPlay() && ss.cursorOn) {
		ss.sel = ss.cursor;
		mark(v);
		delete ss.sel;
	}
};

// the selected cell's mark: 1..3 a planet, -1 or 0 blank
export const selMark = () => (ss.sel && ss.pzl ? ss.pzl.marks[ss.sel[0]][ss.sel[1]] : -1);

// marks the selected cell with a planet (1..3) or clears it (0). The first mark in a cell is free; any change after
// that costs, a clearing too: a blank is an answer as well ("nothing here").
export const mark = (v) => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over || !ss.sel) {
		return;
	}

	const [i, j] = ss.sel;
	const was = pzl.marks[i][j];

	// the same mark again, or clearing a blank cell, changes nothing
	if (v === was || (!v && was < 1)) {
		return;
	}

	pzl.marks[i][j] = v;
	delete ss.sel;

	if (was === -1) {
		sfx('plop');
	} else {
		pzl.changes += 1;
		sfx(v ? 'plop' : 'click');
		sfx('coin1');
	}

	if (matches(pzl)) {
		win();
		return;
	}

	persist();
};

// the planets on the map
export const planetCount = () => (ss.pzl ? ss.pzl.marks.flat().filter((v) => v > 0).length : 0);

// Clear All: every planet on the map cleared, each a change of mind, as if cleared one by one
export const clearAll = () => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over || !planetCount()) {
		return;
	}

	pzl.marks = pzl.marks.map((row) =>
		row.map((v) => {
			if (v > 0) {
				pzl.changes += 1;
				return 0;
			}

			return v;
		})
	);

	delete ss.sel;
	sfx('click');
	sfx('coin1');

	if (matches(pzl)) {
		win();
		return;
	}

	persist();
};

// the map is the sky: every planet in place, the rest blank
const matches = (pzl) => pzl.sol.every((row, i) => row.every((v, j) => Math.max(0, pzl.marks[i][j]) === v));

export const avgScore = () => (ss.stats.plays ? ss.stats.total / ss.stats.plays : 0);

// The game ends the moment the map matches the sky: there's no Done to tap, and no telling which cells are off.
// It scores the balance left; the best is only from games solved.
const win = () => {
	const pzl = ss.pzl;
	const prevAvg = avgScore();
	const { stats } = ss;
	const score = balance();
	const hadBest = stats.solved > 0;

	stats.plays += 1;
	stats.solved += 1;
	stats.total += score;

	const best = !hadBest || score > stats.best;

	if (best) {
		stats.best = score;
	}

	pzl.over = 'won';
	sfx('won');

	ss.message =
		hadBest && best ? MSG_BEST_SCORE : stats.plays > 1 && avgScore() > prevAvg ? MSG_AVERAGE_IMPROVED : score < 0 ? MSG_BROKE : MSG_WON;
	gameOver();
};

// the game-over message holds the button's place for a while, then gives way to Play new
const gameOver = () => {
	delete ss.sel;
	delete ss.cursorOn;
	ss.prompt = PROMPT_PLAY_NEW;
	ss.overAt = Date.now();
	persist();
};

// gives up and shows the sky as it is (the map's planets change over, cell by cell). It counts as a play, scoring
// no more than breaking even: $0, or the balance if it's below that.
export const reveal = () => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

	ss.stats.plays += 1;
	ss.stats.total += Math.min(0, balance());

	pzl.over = 'revealed';
	sfx('lost');
	ss.message = MSG_REVEALED;
	gameOver();
};

export const resetStats = () => {
	ss.stats = newStats();
	persist();
};

// the card with the keyboard shortcuts (Keys on the toolbar, or ?)
export const toggleKeys = () => {
	if (ss.keys) {
		delete ss.keys;
	} else {
		ss.keys = true;
	}
};

// Back: from a game to the launcher, from the launcher to Home
export const goBack = () => {
	if (ss.launcher) {
		ss.home = true;
		return;
	}

	delete ss.prompt;
	delete ss.sel;
	delete ss.cursorOn;

	// a turn under way lands at once, and is charged; any other motion is dropped
	const landing = turnUnderWay() ? ss.target : undefined;

	stopTurning();

	if (landing !== undefined) {
		ss.angle = landing * 90;
		onSettled();
	} else if (ss.pzl) {
		ss.angle = ss.pzl.step * 90;
	}

	ss.launcher = true;
};
