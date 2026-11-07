// The first itch.io screenshot as a GIF, showing Resume: a game with the palette up, Back, then (the launcher kept out of
// the picture) the map flipping back with the planets hovering over it, and the palette up again, so it loops. From the real game in headless
// Chrome with a throwaway profile, ffmpeg for the palette and the GIF: node scripts/render-resume-gif.mjs [output.gif]
// Needs the dev server (npm run dev), Node 22 or later and ffmpeg. FPS, COLORS and SCALE (of the 450 × 800 page) can be set
// in the environment, and FRAMES keeps the frames in a folder, to try other encodings on.
//
// A screenshot takes longer than a frame should, so the page runs on a clock of its own: once the game is set up, its
// timers, requestAnimationFrame and Web Animations all move only when a frame is due, by exactly one frame's time.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.argv[2] ?? join(HERE, '../itch/screenshots/1-resume.gif'));
const GAME = process.env.GAME ?? 'http://localhost:1119/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9336;

const FPS = +(process.env.FPS ?? 15);
const COLORS = +(process.env.COLORS ?? 256);
const SCALE = +(process.env.SCALE ?? 1.5);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the page's own clock; __startClock when the timers already running have run out, __tick for each frame
const CLOCK = `(() => {
	const real = performance.now.bind(performance);
	const realClear = clearTimeout.bind(window);
	const realCancel = cancelAnimationFrame.bind(window);
	const FIRST = 1e9;
	let clock = null;
	let next = FIRST;
	let frames = [];
	let timers = [];
	const seen = new WeakMap();

	performance.now = () => clock ?? real();
	window.requestAnimationFrame = (f) => (frames.push([next, f]), next++);
	window.cancelAnimationFrame = (id) => (id < FIRST ? realCancel(id) : (frames = frames.filter(([k]) => k !== id)));
	window.setTimeout = (f, ms = 0, ...args) => (timers.push([next, (clock ?? real()) + ms, f, args]), next++);
	window.clearTimeout = (id) => (id < FIRST ? realClear(id) : (timers = timers.filter(([k]) => k !== id)));
	window.__startClock = () => { clock = real(); };

	window.__tick = (ms) => {
		clock += ms;

		const due = timers.filter((t) => t[1] <= clock);
		timers = timers.filter((t) => t[1] > clock);
		due.forEach(([, , f, args]) => f(...args));

		const now = frames;
		frames = [];
		now.forEach(([, f]) => f(clock));

		for (const a of document.getAnimations()) {
			if (!seen.has(a)) {
				seen.set(a, [clock, a.currentTime ?? 0]);
				a.pause();
			}

			const [from, at] = seen.get(a);
			const t = at + clock - from;
			const end = a.effect.getComputedTiming().endTime;

			if (t >= end) {
				a.finish();
			} else {
				a.currentTime = t;
			}
		}
	};
})()`;

try {
	await fetch(GAME);
} catch {
	console.error(`no game at ${GAME}: start it with npm run dev`);
	process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'resume-gif-'));
const dir = process.env.FRAMES ?? join(work, 'frames');
mkdirSync(dir, { recursive: true });

const chrome = spawn(CHROME, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${join(work, 'profile')}`,
	'--window-size=450,800',
	'--disable-lcd-text',
	'--hide-scrollbars',
	'--no-first-run',
	'about:blank'
]);

try {
	let target;

	for (let i = 0; i < 40 && !target; i++) {
		await sleep(250);

		try {
			const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
			target = list.find((t) => t.type === 'page');
		} catch {
			// not up yet
		}
	}

	if (!target) {
		throw new Error('Chrome did not start');
	}

	const ws = new WebSocket(target.webSocketDebuggerUrl);
	await new Promise((r) => (ws.onopen = r));

	let id = 0;
	const pending = new Map();
	const problems = [];

	ws.onmessage = (m) => {
		const d = JSON.parse(m.data);

		if (d.id) {
			pending.get(d.id)?.(d.result ?? d);
			pending.delete(d.id);
		} else if (d.method === 'Runtime.exceptionThrown') {
			problems.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
		}
	};

	const send = (method, params = {}) =>
		new Promise((r) => {
			pending.set(++id, r);
			ws.send(JSON.stringify({ id, method, params }));
		});

	const evaluate = async (expression) => {
		const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });

		if (r.exceptionDetails) {
			throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
		}

		return r.result?.value;
	};

	const centre = (text) =>
		evaluate(`(() => {
			const all = [...document.querySelectorAll('button, [role=button], div, span')];
			const el = all.filter((e) => e.textContent.trim().toLowerCase() === ${JSON.stringify(text)} && e.getBoundingClientRect().width > 0).pop();
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
		})()`);

	const mouse = (type, p) => send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });

	// the mouse out of the way, off the buttons' hover and the map's
	const PARKED = { x: 225, y: 2 };

	const at = async (text) => {
		const p = await centre(text);

		if (!p) {
			throw new Error(`no "${text}" on the page`);
		}

		return p;
	};

	const click = async (text) => {
		const p = await at(text);

		for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
			await mouse(type, p);
		}
	};

	await send('Page.enable');
	await send('Runtime.enable');
	await send('Emulation.setDeviceMetricsOverride', { width: 450, height: 800, deviceScaleFactor: SCALE, mobile: false });
	await send('Page.navigate', { url: GAME });

	for (let i = 0; i < 120 && !(await centre('binge')); i++) {
		await sleep(500);
	}

	await sleep(800);
	await click('binge');
	await sleep(800);
	await click('not easy');
	await sleep(300);
	await click('start');
	await sleep(3200);
	await mouse('mouseMoved', PARKED);

	const store = await evaluate("performance.getEntriesByType('resource').map((e) => e.name).find((n) => /shared\\.svelte/.test(n))");
	await evaluate(`import(${JSON.stringify(store)}).then((s) => { window.__s = s; })`);

	// A deal that shows the eclipse at 90°: seen from the north, as two turns will, a planet near in its lane with a bigger
	// one behind it.
	let chosen;

	for (let tries = 0; tries < 40 && !chosen; tries++) {
		const sol = await evaluate('JSON.parse(JSON.stringify(__s.ss.pzl.sol))');
		const planets = sol.flatMap((row, i) => row.flatMap((v, j) => (v ? [{ i, j, v }] : [])));
		const pair = planets.flatMap((a) => planets.filter((b) => b.j === a.j && b.i > a.i && b.v > a.v).map((b) => [a, b]))[0];

		if (pair && planets.length >= 7) {
			const rest = planets.filter((p) => !pair.includes(p));
			// the others spread over the lanes, and a cell left to mark, in the map's middle for the palette to stay on it
			const middle = (k) => k > 0 && k < sol.length - 1;
			const spot = rest.find((p) => middle(p.i) && middle(p.j)) ?? rest.find((p) => middle(p.j)) ?? rest[0];
			const others = rest.filter((p) => p !== spot && p.j !== pair[0].j);
			const lanes = [...new Map(others.map((p) => [p.j, p])).values()].slice(0, 3);
			chosen = { marks: [...pair, ...lanes], spot };
		} else {
			await evaluate('__s.playNew()');
			await sleep(2600);
		}
	}

	if (!chosen) {
		throw new Error('no deal with an eclipse');
	}

	for (let i = 0; i < 2; i++) {
		await evaluate('__s.turnBy(1)');
		await sleep(900);
	}

	for (const { i, j, v } of chosen.marks) {
		await evaluate(`__s.select(${i}, ${j}); __s.mark(${v});`);
		await sleep(250);
	}

	const openPalette = () => evaluate(`__s.select(${chosen.spot.i}, ${chosen.spot.j})`);

	await openPalette();
	await sleep(700);

	// the launcher stays out of the picture, though the game goes by way of it
	await evaluate("document.head.append(Object.assign(document.createElement('style'), { textContent: '.launching { visibility: hidden; }' }))");

	// from here on, the page's clock
	await evaluate(CLOCK);
	await sleep(200);
	await evaluate('__startClock()');

	let frame = 0;

	const play = async (seconds) => {
		for (let n = Math.round(seconds * FPS); n > 0; n--) {
			await evaluate(`__tick(${1000 / FPS})`);
			const { data } = await send('Page.captureScreenshot', { format: 'png' });
			writeFileSync(join(dir, `${String(frame++).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
		}
	};

	// the game, the palette up, as in the first screenshot
	await play(1.6);

	// Back
	await mouse('mouseMoved', await at('back'));
	await play(0.3);
	await click('back');
	await play(0.4);

	// Resume, as the launcher's button does it
	await mouse('mouseMoved', PARKED);
	await evaluate('delete __s.ss.launcher; __s.onPlay(__s.ss.level)');

	// the page's fade-in and the pause edge-on (750 ms), the flip (500), the tray's planets growing in (700)
	await play(2);
	await play(1.2);

	// the palette again, for the loop to come round to the start
	await openPalette();
	await play(0.5);

	ws.close();

	if (problems.length) {
		console.error('page errors', JSON.stringify(problems));
		process.exitCode = 1;
	}

	// one palette for the whole GIF, and no dither: the sky's drift would make dither shimmer, and cost a lot
	mkdirSync(dirname(OUT), { recursive: true });

	const filter = `[0:v]split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`;
	const ffmpeg = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-lavfi', filter, '-loop', '0', OUT], {
		stdio: 'inherit'
	});

	if (ffmpeg.status !== 0) {
		throw new Error('ffmpeg failed');
	}

	console.log(`${OUT}: ${frame} frames, ${(statSync(OUT).size / 1048576).toFixed(2)} MB`);
} catch (e) {
	console.error(e.message);
	process.exitCode = 1;
} finally {
	chrome.kill();
	await sleep(500);

	try {
		rmSync(work, { recursive: true, force: true });
	} catch {
		// Chrome still letting go of its profile: it's only a temp folder
	}
}

process.exit();
