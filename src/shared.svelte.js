import {
	APP_STATE,
	GIVE_UP_TURNS,
	LEVELS,
	MSG_AVERAGE_IMPROVED,
	MSG_BEST_SCORE,
	MSG_REVEALED,
	MSG_WON,
	PROMPT_PLAY_NEW,
	TAP_TURN_MS,
	TURN_MS
} from './const';
import { generate } from './logic';
import { _sound, sfx, whoosh } from './sound.svelte';

// the side facing the player at a board angle, 0..3 (South, East, North, West)
export const sideAt = (deg) => ((Math.round(deg / 90) % 4) + 4) % 4;

export const newStats = () => ({ plays: 0, solved: 0, total: 0, best: 0 });

// pzl: the puzzle under way, per level: { N, diff, sol, marks, step, turns, seen, over }
//   marks: -1 blank (counts as empty), 0 marked empty, 1..3 a sphere
//   step: quarter turns clockwise so far, net (the board's angle at rest is step × 90°)
//   over: 'won' or 'revealed'
// angle: the board's angle on screen, in degrees clockwise; between steps while it turns
// rise: 1 while the horizon's spheres are still below it (a new puzzle), easing to 0
export const ss = $state({
	home: true,
	scale: 1,
	stats: newStats(),
	brush: 1,
	angle: 0,
	rise: 0
});

const appKey = () => `${APP_STATE} • ${ss.level}`;

export const _log = (value) => console.log($state.snapshot(value));

export const level = () => LEVELS.find((l) => l.id === ss.level);

export const isOver = () => !!ss.pzl?.over;

export const persistCommon = () => {
	const json = JSON.stringify({ sfx: _sound.sfx, music: _sound.music, brush: ss.brush, swiped: ss.swiped });
	localStorage.setItem(APP_STATE, json);
};

export const loadCommon = () => {
	const job = JSON.parse(localStorage.getItem(APP_STATE));

	if (job) {
		_sound.sfx = job.sfx;
		_sound.music = job.music;
		ss.brush = job.brush ?? 1;
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
	stopTurning();

	ss.angle = 0;
	ss.pzl = {
		N,
		diff,
		sol,
		marks: Array.from({ length: N }, () => Array(N).fill(-1)),
		step: 0,
		turns: 0,
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

		const job = JSON.parse(localStorage.getItem(appKey()));
		// saves from before give-ups counted have no solved: every play then was a solve
		ss.stats = job?.stats ? { solved: job.stats.plays, ...job.stats } : newStats();

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

export const paint = (i, j) => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

	const clear = pzl.marks[i][j] === ss.brush;
	pzl.marks[i][j] = clear ? -1 : ss.brush;
	sfx(clear ? 'click' : 'plop');

	if (matches(pzl)) {
		win();
		return;
	}

	persist();
};

// the map is the sky: every planet in place, the rest blank or marked empty
const matches = (pzl) => pzl.sol.every((row, i) => row.every((v, j) => Math.max(0, pzl.marks[i][j]) === v));

export const avgScore = () => (ss.stats.plays ? ss.stats.total / ss.stats.plays : 0);

// the game ends the moment the map matches the sky: there's no Done to tap, and no telling which cells are off
const win = () => {
	const pzl = ss.pzl;
	const prevAvg = avgScore();
	const { stats } = ss;
	// a best only once a game is solved (a lucky guess can solve one without a turn, so 0 is a score)
	const hadBest = stats.solved > 0;

	stats.plays += 1;
	stats.solved += 1;
	stats.total += pzl.turns;

	const best = !hadBest || pzl.turns < stats.best;

	if (best) {
		stats.best = pzl.turns;
	}

	pzl.over = 'won';
	sfx('won');

	ss.message = hadBest && best ? MSG_BEST_SCORE : stats.plays > 1 && avgScore() < prevAvg ? MSG_AVERAGE_IMPROVED : MSG_WON;
	gameOver();
};

// the game-over message holds the button's place for a while, then gives way to Play new
const gameOver = () => {
	ss.prompt = PROMPT_PLAY_NEW;
	ss.overAt = Date.now();
	persist();
};

// gives up and shows the sky as it is (the map's planets change over, cell by cell). It counts as a play, with a penalty, so giving up can't help the average.
export const reveal = () => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

	ss.stats.plays += 1;
	ss.stats.total += pzl.turns + GIVE_UP_TURNS;

	pzl.over = 'revealed';
	sfx('drop');
	ss.message = MSG_REVEALED;
	gameOver();
};

export const resetStats = () => {
	ss.stats = newStats();
	persist();
};

export const goHome = () => {
	delete ss.prompt;
	stopTurning();

	if (ss.pzl) {
		ss.angle = ss.pzl.step * 90;
	}

	ss.home = true;
};
