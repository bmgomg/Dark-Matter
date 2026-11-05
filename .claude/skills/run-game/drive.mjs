// Drives headless Chrome over the DevTools protocol: splash → Home → launcher → a game → Back. See SKILL.md.
// node drive.mjs <output folder> [url]
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = process.argv[2];
const URL = process.argv[3] ?? 'http://localhost:1119/';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;

if (!OUT) {
	console.error('usage: node drive.mjs <output folder> [url]');
	process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'run-game-'));

const chrome = spawn(CHROME, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${profile}`,
	'--window-size=450,800',
	'--no-first-run',
	'about:blank'
]);

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

const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result?.value;

const shot = async (name) => {
	const { data } = await send('Page.captureScreenshot', { format: 'png' });
	writeFileSync(join(OUT, name), Buffer.from(data, 'base64'));
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

const report = (step) =>
	evaluate(`(() => {
		const box = (s) => {
			const e = document.querySelector(s);
			if (!e) return null;
			const r = e.getBoundingClientRect();
			return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
		};
		return { launcher: box('.launcher'), credit: box('.credit'), board: box('.board') };
	})()`).then((r) => console.log(step, JSON.stringify(r)));

try {
	await send('Page.enable');
	await send('Runtime.enable');
	await send('Emulation.setDeviceMetricsOverride', { width: 450, height: 800, deviceScaleFactor: 2, mobile: false });
	await send('Page.navigate', { url: URL });

	// a cold dev server's first load, then the splash
	for (let i = 0; i < 120 && !(await centre('play')); i++) {
		await sleep(500);
	}

	await sleep(500);
	await report('home');
	await shot('1-home.png');

	await click('play');
	await sleep(800);
	await report('launcher');
	await shot('2-launcher.png');

	await click('start');
	await sleep(1500);
	await report('game');
	await shot('3-game.png');

	await click('back');
	await sleep(800);
	await report('back to the launcher');

	console.log('page errors', JSON.stringify(problems));
	process.exitCode = problems.length ? 1 : 0;
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
