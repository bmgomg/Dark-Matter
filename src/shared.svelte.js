import {
	APP_STATE,
	BANK,
	COST_CHANGE,
	COST_TURN,
	LEVELS,
	MSG_AVERAGE_IMPROVED,
	MSG_BEST_SCORE,
	MSG_BROKE,
	MSG_REVEALED,
	MSG_WON,
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
//   turns, changes: what the game has cost so far, in quarter turns and changes of mind
//   step: quarter turns clockwise so far, net (the board's angle at rest is step × 90°)
//   over: 'won' or 'revealed'
// angle: the board's angle on screen, in degrees clockwise; between steps while it turns
// rise: 1 while the horizon's spheres are still below it (a new puzzle), easing to 0
// sel: the cell being marked, [i, j], while the palette is up
export const ss = $state({
	home: true,
	scale: 1,
	stats: newStats(),
	angle: 0,
	rise: 0
});

const appKey = () => `${APP_STATE} • ${ss.level}`;

export const _log = (value) => console.log($state.snapshot(value));

export const level = () => LEVELS.find((l) => l.id === ss.level);

export const isOver = () => !!ss.pzl?.over;

// what the game has cost so far, and what's left of the bank
export const cost = () => (ss.pzl ? ss.pzl.turns * COST_TURN + ss.pzl.changes * COST_CHANGE : 0);
export const balance = () => BANK - cost();

export const persistCommon = () => {
	const json = JSON.stringify({ sfx: _sound.sfx, music: _sound.music, swiped: ss.swiped });
	localStorage.setItem(APP_STATE, json);
};

export const loadCommon = () => {
	const job = JSON.parse(localStorage.getItem(APP_STATE));

	if (job) {
		_sound.sfx = job.sfx;
		_sound.music = job.music;
		ss.swiped = job.swiped;
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
	const t0 = performance.now();

	if (still() || from === to) {
		ss[key] = to;
		done?.();
		return;
	}

	const tick = (t) => {
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

export const stopTurning = () => {
	cancelAnimationFrame(tweens.angle);
	delete tweens.angle;
	delete ss.target;
	delete ss.turnFrom;
};

const riseHorizon = (delay = 0) => {
	ss.rise = 1;
	setTimeout(() => tween('rise', 0, 700), delay);
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

	pzl.turns += Math.abs(step - pzl.step);
	pzl.step = step;
	pzl.seen[sideAt(ss.angle)] = true;

	// the player knows how to turn the board now, whichever way they did it: the hint moves on
	if (!ss.swiped) {
		ss.swiped = true;
		persistCommon();
	}

	persist();
};

// the board eases to rest on a quarter turn: quickly after a swipe, slowly and evenly after a tap;
// turnFrom: the angle it set off from, for the tray to slide the next lineup in over the whole of the turn
export const spinTo = (step, tapped = false) => {
	if (ss.target !== step && step !== ss.pzl?.step) {
		whoosh();
	}

	ss.target = step;
	ss.turnFrom = ss.angle;
	tween('angle', step * 90, tapped ? TAP_TURN_MS : TURN_MS, onSettled, tapped ? linear : easeOut);
};

// a tap on an arrow, or ← →; dir 1: clockwise from above, so the east side comes round to the front (as a swipe to the left)
export const turnBy = (dir) => {
	if (!ss.pzl) {
		return;
	}

	spinTo((ss.target ?? Math.round(ss.angle / 90)) + dir, true);
};

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
	riseHorizon(250);
	persist();
};

// a level's saved game goes on unless it was finished; each level keeps its own stats
export const onPlay = (id) => {
	if (id !== ss.level) {
		ss.level = id;
		delete ss.pzl;
		delete ss.prompt;
		delete ss.message;
		delete ss.sel;

		const job = JSON.parse(localStorage.getItem(appKey()));
		ss.stats = job?.stats ?? newStats();

		if (job?.pzl && !job.pzl.over) {
			ss.pzl = job.pzl;
			ss.angle = job.pzl.step * 90;
			riseHorizon(400);
		}
	}

	if (!ss.pzl || ss.pzl.over) {
		newPuzzle();
	}

	if (!_sound.musicPlayed) {
		_sound.playMusic();
	}

	delete ss.home;
};

// a tap on a cell picks it for marking and brings up the palette; a tap on it again puts the palette away
export const select = (i, j) => {
	if (!ss.pzl || ss.pzl.over) {
		return;
	}

	tap();

	if (ss.sel?.[0] === i && ss.sel?.[1] === j) {
		delete ss.sel;
	} else {
		ss.sel = [i, j];
	}
};

export const deselect = () => delete ss.sel;

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
	sfx('drop');
	ss.message = MSG_REVEALED;
	gameOver();
};

export const resetStats = () => {
	ss.stats = newStats();
	persist();
};

// Back: from a game to the launcher, from the launcher to Home
export const goBack = () => {
	if (ss.launcher) {
		ss.home = true;
		return;
	}

	delete ss.prompt;
	delete ss.sel;
	stopTurning();

	if (ss.pzl) {
		ss.angle = ss.pzl.step * 90;
	}

	ss.launcher = true;
};
