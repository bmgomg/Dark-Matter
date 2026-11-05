// The itch.io art as a GIF: one full turn of the board in cover.html, from its first view round to it again, holding on
// it at the start, so the first frame is the still picture. Headless Chrome over the DevTools protocol for the frames,
// ffmpeg for the palette and the GIF: node scripts/render-cover-gif.mjs [cover|embed|wide] [output.gif]
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LAYOUTS = {
	cover: { width: 630, height: 500, hash: '', file: 'cover.gif', fps: 12, colors: 96 },
	embed: { width: 640, height: 360, hash: '#embed', file: 'embed-bg.gif', fps: 15, colors: 256 },
	wide: { width: 840, height: 360, hash: '#wide', file: 'wide-cover.gif', fps: 10, colors: 112 }
};
const LAYOUT = LAYOUTS[process.argv[2] ?? 'cover'];

if (!LAYOUT) {
	console.error('usage: node render-cover-gif.mjs [cover|embed|wide] [output.gif]');
	process.exit(1);
}

const OUT = resolve(process.argv[3] ?? join(HERE, '../itch', LAYOUT.file));
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;

const FPS = +(process.env.FPS ?? LAYOUT.fps);
const TURN_SECONDS = +(process.env.TURN ?? 6);
const HOLD_SECONDS = +(process.env.HOLD ?? 1.5);
const COLORS = +(process.env.COLORS ?? LAYOUT.colors);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const work = mkdtempSync(join(tmpdir(), 'cover-gif-'));

const chrome = spawn(CHROME, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${join(work, 'profile')}`,
	'--allow-file-access-from-files',
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

	ws.onmessage = (m) => {
		const d = JSON.parse(m.data);

		if (d.id) {
			pending.get(d.id)?.(d.result ?? d);
			pending.delete(d.id);
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
	};

	await send('Emulation.setDeviceMetricsOverride', { width: LAYOUT.width, height: LAYOUT.height, deviceScaleFactor: 1, mobile: false });
	await send('Page.enable');
	await send('Page.navigate', { url: pathToFileURL(join(HERE, 'cover.html')).href + LAYOUT.hash });
	await sleep(500);
	await evaluate('window.ready');

	// sets off from the hold and settles back into it over RAMP of the turn at either end, at a steady speed between:
	// the lowest top speed for the time, and so the least jump from frame to frame
	const RAMP = 0.2;
	const SPEED = 1 / (1 - RAMP);
	const ease = (t) =>
		t < RAMP ? (SPEED * t * t) / (2 * RAMP) : t > 1 - RAMP ? 1 - (SPEED * (1 - t) * (1 - t)) / (2 * RAMP) : SPEED * (t - RAMP / 2);
	const holds = Math.round(FPS * HOLD_SECONDS);
	const turns = Math.round(FPS * TURN_SECONDS);
	const frames = [...Array(holds).fill(0), ...Array.from({ length: turns }, (_, i) => ease(i / turns))];

	// FRAMES keeps them in a folder of its own, to try other encodings on
	const dir = process.env.FRAMES ?? join(work, 'frames');
	mkdirSync(dir, { recursive: true });

	for (const [i, turned] of frames.entries()) {
		await evaluate(`window.frame(${turned}, { sky: true, whole: ${i < holds} })`);
		const { data } = await send('Page.captureScreenshot', { format: 'png' });
		writeFileSync(join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
	}

	ws.close();

	// one palette for the whole GIF, and no dither: cover.html's grain does that job where it's cheap (see there)
	mkdirSync(dirname(OUT), { recursive: true });

	const filter = `[0:v]split[a][b];[a]palettegen=max_colors=${COLORS}:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle`;
	const ffmpeg = spawnSync(
		'ffmpeg',
		['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-lavfi', filter, '-loop', '0', OUT],
		{ stdio: 'inherit' }
	);

	if (ffmpeg.status !== 0) {
		throw new Error('ffmpeg failed');
	}

	console.log(`${OUT}: ${frames.length} frames, ${(statSync(OUT).size / 1048576).toFixed(2)} MB`);
} finally {
	chrome.kill();
	await sleep(500);

	try {
		rmSync(work, { recursive: true, force: true });
	} catch {
		// Chrome still letting go of its profile: it's only a temp folder
	}
}
