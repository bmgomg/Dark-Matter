import {
	APP_STATE,
	LEVELS,
	MSG_AVERAGE_IMPROVED,
	MSG_BEST_SCORE,
	MSG_REVEALED,
	MSG_WON,
	PROMPT_PLAY_NEW,
	PROMPT_WRONG,
	TURN_MS
} from './const';
import { generate } from './logic';
import { _sound, sfx, whoosh } from './sound.svelte';

// the side facing the player at a board angle, 0..3 (South, East, North, West)
export const sideAt = (deg) => ((Math.round(deg / 90) % 4) + 4) % 4;

export const newStats = () => ({ plays: 0, total: 0, best: 0 });

// pzl: the puzzle under way, per level: { N, diff, sol, marks, step, turns, seen, wrong, over }
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

const ease = (k) => 1 - (1 - k) ** 3;

// one animation at a time per value: a new one cancels the old
const tweens = {};

const tween = (key, to, ms, done) => {
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

	if (!pzl || step === pzl.step) {
		return;
	}

	pzl.turns += Math.abs(step - pzl.step);
	pzl.step = step;
	pzl.seen[sideAt(ss.angle)] = true;

	persist();
};

export const spinTo = (step) => {
	if (ss.target !== step && step !== Math.round(ss.angle / 90)) {
		whoosh();
	}

	ss.target = step;
	tween('angle', step * 90, TURN_MS, onSettled);
};

// dir 1: clockwise from above, so the east side comes round to the front (as a swipe to the left)
export const turnBy = (dir) => {
	if (!ss.pzl) {
		return;
	}

	spinTo((ss.target ?? Math.round(ss.angle / 90)) + dir);
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
		seen: [true, false, false, false],
		wrong: []
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

export const paint = (i, j) => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

	const clear = pzl.marks[i][j] === ss.brush;
	pzl.marks[i][j] = clear ? -1 : ss.brush;
	sfx(clear ? 'click' : 'plop');

	if (pzl.wrong.length) {
		pzl.wrong = [];
	}

	if (ss.prompt === PROMPT_WRONG) {
		delete ss.prompt;
	}

	delete ss.message;
	persist();
};

export const avgScore = () => (ss.stats.plays ? ss.stats.total / ss.stats.plays : 0);

export const onDone = () => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

	const wrong = [];

	for (let i = 0; i < pzl.N; i++) {
		for (let j = 0; j < pzl.N; j++) {
			if (Math.max(0, pzl.marks[i][j]) !== pzl.sol[i][j]) {
				wrong.push([i, j]);
			}
		}
	}

	pzl.wrong = wrong;

	if (wrong.length) {
		sfx('lost', 1, 0.7);
		ss.message = wrong.length === 1 ? 'One cell is off.' : `${wrong.length} cells are off.`;
		ss.prompt = PROMPT_WRONG;
		persist();
		return;
	}

	const prevAvg = avgScore();
	const { stats } = ss;

	stats.plays += 1;
	stats.total += pzl.turns;

	const best = stats.plays === 1 || pzl.turns < stats.best;

	if (best) {
		stats.best = pzl.turns;
	}

	pzl.over = 'won';
	sfx('won');

	ss.message = stats.plays > 1 && best ? MSG_BEST_SCORE : stats.plays > 1 && avgScore() < prevAvg ? MSG_AVERAGE_IMPROVED : MSG_WON;
	gameOver();
};

// the game-over message holds the button's place for a while, then gives way to Play new
const gameOver = () => {
	ss.prompt = PROMPT_PLAY_NEW;
	ss.overAt = Date.now();
	persist();
};

// shows the sky as it is; the cells marked wrong stay outlined
export const reveal = () => {
	const pzl = ss.pzl;

	if (!pzl || pzl.over) {
		return;
	}

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
