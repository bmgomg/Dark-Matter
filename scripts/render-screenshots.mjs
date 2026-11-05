// The itch.io screenshots, 900 × 1600 (the 450 × 800 page at twice the size), from the real game in headless Chrome, with
// a throwaway profile: node scripts/render-screenshots.mjs [output folder]
// Needs the dev server (npm run dev), since it reaches the store through its source module, and Node 22 or later. It plays
// through the game's own functions, reading the solution, not with a mouse, so the scoreboard shows a clean win. The puzzle
// is random, and not every one shows rings in the tray: look at the results, and run it again if they don't.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.argv[2] ?? join(HERE, '../itch/screenshots'));
const GAME = process.env.GAME ?? 'http://localhost:1119/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9335;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
	await fetch(GAME);
} catch {
	console.error(`no game at ${GAME}: start it with npm run dev`);
	process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), 'screenshots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=450,800', '--no-first-run', 'about:blank']);

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
	chrome.kill();
	console.error('Chrome did not start');
	process.exit(1);
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

const shot = async (name) => {
	const { data } = await send('Page.captureScreenshot', { format: 'png' });
	writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
	console.log(name);
};

// the centre of the deepest visible element with exactly this text, ignoring case
const centre = (text) =>
	evaluate(`(() => {
		const all = [...document.querySelectorAll('button, [role=button], div, span')];
		const el = all.filter((e) => e.textContent.trim().toLowerCase() === ${JSON.stringify(text)} && e.getBoundingClientRect().width > 0).pop();
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
	})()`);

const click = async (text) => {
	const p = await centre(text);

	if (!p) {
		throw new Error(`no "${text}" on the page`);
	}

	for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
		await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
	}
};

// the mouse out of the way, off the buttons' hover
const park = () => send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 225, y: 2, button: 'none' });

const TURN_WAIT = 900;

try {
	await send('Page.enable');
	await send('Runtime.enable');
	await send('Emulation.setDeviceMetricsOverride', { width: 450, height: 800, deviceScaleFactor: 2, mobile: false });
	await send('Page.navigate', { url: GAME });

	// a cold dev server's first load, then the splash
	for (let i = 0; i < 120 && !(await centre('play')); i++) {
		await sleep(500);
	}

	await sleep(800);
	await park();
	await sleep(300);
	await shot('4-home.png');

	await click('play');
	await sleep(800);
	await click('not easy');
	await sleep(300);
	await park();
	await sleep(400);
	await shot('5-launcher.png');

	// past the map's flip and the planets' growing in
	await click('start');
	await sleep(3200);
	await park();
	await shot('2-new-puzzle.png');

	// the store as the page has it: the dev server may have added ?t= to the module's URL, and a plain import would be
	// another copy, with no puzzle in it
	const store = await evaluate('performance.getEntriesByType(\'resource\').map((e) => e.name).find((n) => /shared\\.svelte/.test(n))');
	await evaluate(`import(${JSON.stringify(store)}).then((s) => { window.__s = s; })`);

	const sol = await evaluate('JSON.parse(JSON.stringify(__s.ss.pzl.sol))');
	const planets = sol.flatMap((row, i) => row.flatMap((v, j) => (v ? [[i, j, v]] : [])));
	const half = Math.ceil(planets.length / 2);

	const turn = async () => {
		await evaluate('__s.turnBy(1)');
		await sleep(TURN_WAIT);
	};

	const markAll = async (list) => {
		for (const [i, j, v] of list) {
			await evaluate(`__s.select(${i}, ${j}); __s.mark(${v});`);
			await sleep(250);
		}
	};

	await turn();
	await markAll(planets.slice(0, half - 1));
	await turn();
	await markAll(planets.slice(half - 1, half));
	await sleep(500);

	// the palette, on a cell that's still blank but has a planet to come
	const [i, j] = planets[half];
	await evaluate(`__s.select(${i}, ${j})`);
	await sleep(500);
	await shot('1-play.png');
	await evaluate('__s.deselect()');

	await turn();
	await markAll(planets.slice(half));

	// into the win's swell
	await sleep(700);
	await shot('3-win.png');

	if (problems.length) {
		console.error('page errors', JSON.stringify(problems));
		process.exitCode = 1;
	}
} catch (e) {
	console.error(e.message);
	process.exitCode = 1;
} finally {
	ws.close();
	chrome.kill();
	await sleep(500);

	try {
		rmSync(profile, { recursive: true, force: true });
	} catch {
		// Chrome hasn't let go yet: it's only a temp folder
	}
}

process.exit();
