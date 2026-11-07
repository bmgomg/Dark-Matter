import { cubicInOut } from 'svelte/easing';
import { DX } from './const';

export const windowSize = () => {
	const d = document,
		e = d.documentElement,
		g = d.getElementsByTagName('body')[0],
		w = e.clientWidth || g.clientWidth,
		h = e.clientHeight || g.clientHeight;

	return { w, h };
};

export const clientRect = (selector) => {
	const ob = document.querySelector(selector);
	const r = ob?.getBoundingClientRect();

	return r;
};

export const rectCenter = (selector) => {
	const ob = document.querySelector(selector);
	const r = ob?.getBoundingClientRect();

	return r
		? {
				x: r.left + r.width / 2,
				y: r.top + r.height / 2
			}
		: null;
};

export const underMouse = (event, selectors) => {
	for (const selector of selectors) {
		const r = clientRect(selector);

		if (!r) {
			continue;
		}

		const x = event.clientX;
		const y = event.clientY;

		if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
			return true;
		}
	}

	return false;
};

export const focusOnApp = () => {
	document.querySelector('.app')?.focus();
};

export const isTouchable = () => navigator.maxTouchPoints > 0;

export const tapOrClick = (lower = false) => {
	const verb = isTouchable() ? 'Tap' : 'Click';
	return lower ? verb.toLowerCase() : verb;
};

export const isAppleDevice = () =>
	/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// acceptLanguage: pass request.headers.get('accept-language') during SSR; omitted, falls back to navigator.language in the browser
export const isRussian = (acceptLanguage) => {
	const header = acceptLanguage ?? (typeof navigator !== 'undefined' ? navigator.language : '');
	const primary = header.split(',')[0]?.split('-')[0]?.trim().toLowerCase();

	return primary === 'ru';
};

export const scrollClass = () => `root-scroll ${isTouchable() ? 'root-scroll-mobile' : ''}`;

export const post = (fn, ms) => setTimeout(fn, ms);

// Puts text on the clipboard; whether it did. Call it during a press: browsers allow it only then. The old way, by a
// selection, is for where the new one is missing (no https) or refused (a page in a frame, as on itch.io, may be).
export const copyText = async (text) => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		// on to the old way
	}

	const focused = document.activeElement;
	const area = document.createElement('textarea');

	area.value = text;
	area.readOnly = true; // no keyboard coming up on a phone
	area.style = 'position: fixed; opacity: 0;';
	document.body.append(area);
	area.select();
	area.setSelectionRange(0, text.length);

	let copied = false;

	try {
		copied = document.execCommand('copy');
	} catch {
		// nothing more to try
	}

	area.remove();
	focused?.focus();

	return copied;
};

export const _range = (start, end) => Array.from({ length: end + 1 - start }, (_, i) => start + i);

export const shuffleInPlace = (array) => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
};

export const rowCol = (i, size) => {
	const row = Math.floor(i / size) + 1;
	const col = (i % size) + 1;

	return { row, col };
};

// A Svelte transition that slides an element sideways: in from `from` (in `unit`s, vw by default) off to one side, or
// out to it. Two at once, one out and one in, make a push: the splash off to the left as the page comes in from the
// right, and one page for another (see Game Page.svelte). With `raf`, by requestAnimationFrame, not CSS: an animation
// on the compositor during a turn makes it stagger on a Pixel 6a (see Roller Digit).
export const slideX = (node, { from, unit = 'vw', duration, delay = 0, raf = false }) => {
	const at = (t) => `${(1 - t) * from}${unit} 0`;

	return raf
		? { delay, duration, easing: cubicInOut, tick: (t) => (node.style.translate = at(t)) }
		: { delay, duration, easing: cubicInOut, css: (t) => `translate: ${at(t)};` };
};

// A push within the page, by its width, so whatever slides is off it (and clipped) at either end: `way` 1 for on, the
// new one coming in from the right, -1 for back. Spread into an in: and an out: of slideX.
export const pushIn = (way, duration, raf) => ({ from: way * DX, unit: 'px', duration, raf });
export const pushOut = (way, duration, raf) => ({ from: -way * DX, unit: 'px', duration, raf });

// Which way a push goes as what's shown moves along a row of places: 1, on, to a later place, or within the same one;
// -1, back, to an earlier one. Make one per row, and call it from a $derived of the place, so it's called once a change.
export const wayAlong = () => {
	let last = -Infinity;

	return (place) => {
		const way = place < last ? -1 : 1;

		last = place;
		return way;
	};
};
