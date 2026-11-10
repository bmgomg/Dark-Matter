<script>
	import Defs from '../Defs.svelte';
	import GamePage from '../Game Page.svelte';
	import Home from '../Home.svelte';
	import Space from '../Space.svelte';
	import Splash from '../Splash.svelte';
	import { DX, DY, SPLASH_SLIDE_MS } from '../const';
	import { deselect, hideCursor, markCursor, moveCursor, selectCursor, ss, toggleKeys, turnBy, turnHalf } from '../shared.svelte';
	import { _sound } from '../sound.svelte';
	import { clientRect, post, slideX } from '../utils';

	// a key's move of the map's cursor on screen, dx and dy
	const MOVES = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0] };

	$effect(() => {
		const disable = (e) => {
			e.preventDefault();
		};

		// the 450 × 800 page shrinks to fit a smaller window, never grows
		const onResize = () => {
			const r = clientRect('#app');
			ss.scale = Math.min(1, r.width / DX, r.height / DY);
		};

		const toggleMusic = () => {
			_sound.music = -_sound.music;
			_sound.playMusic();
		};

		const onBlur = () => {
			if (_sound.music > 0 && _sound.musicPlayed) {
				toggleMusic();
			}
		};

		const onFocus = () => {
			if (_sound.music < 0) {
				toggleMusic();
			}
		};

		// The Keys button shows only with a keyboard about. There's no telling for sure: a fine pointer (a mouse, a
		// trackpad) suggests one, and a key pressed proves it.
		ss.keyboard = matchMedia('(any-pointer: fine)').matches;

		// ← → turn the board (as a swipe that way), ↑ ↓ a half turn (not on a key's repeat: holding one would run up the
		// bill); W A S D move the map's cursor (and bring the focus to the map);
		// Enter or Space on the map opens the palette; on the selected cell, or else the cursor's, 1 2 3 place a planet, 0
		// (or Delete) clears it; Esc puts the palette away, or else the cursor; ? shows the shortcuts (Keys.svelte), and any
		// key puts them away
		const onKeyDown = (e) => {
			ss.keyboard = true;

			if (ss.home || e.ctrlKey || e.metaKey || e.altKey) {
				return;
			}

			if (ss.keys) {
				if (!['Shift', 'Tab', 'Enter', ' '].includes(e.key)) {
					delete ss.keys;
					e.preventDefault();
				}

				return;
			}

			if (e.key === '?') {
				toggleKeys();
			} else if (ss.launcher) {
				return;
			} else if (e.key === 'ArrowLeft') {
				turnBy(1);
			} else if (e.key === 'ArrowRight') {
				turnBy(-1);
			} else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				if (!e.repeat) {
					turnHalf(e.key === 'ArrowUp' ? 1 : -1);
				}
			} else if (MOVES[e.key.toLowerCase()]) {
				moveCursor(...MOVES[e.key.toLowerCase()]);
				document.querySelector('.board')?.focus({ preventScroll: true });
			} else if (['Enter', ' '].includes(e.key) && e.target.closest?.('.board')) {
				selectCursor();
			} else if (!ss.prompt && ['0', '1', '2', '3'].includes(e.key)) {
				markCursor(+e.key);
			} else if (!ss.prompt && ['Delete', 'Backspace'].includes(e.key)) {
				markCursor(0);
			} else if (ss.sel && e.key === 'Escape') {
				deselect();
			} else if (ss.cursorOn && e.key === 'Escape') {
				hideCursor();
			} else {
				return;
			}

			e.preventDefault();
		};

		onResize();

		// the clock, for the daily's countdown, and its next puzzle at midnight
		const clock = setInterval(() => (ss.now = Date.now()), 1000);

		window.addEventListener('contextmenu', disable);
		window.addEventListener('dblclick', disable);
		window.addEventListener('resize', onResize);
		window.addEventListener('blur', onBlur);
		window.addEventListener('focus', onFocus);
		window.addEventListener('keydown', onKeyDown);

		return () => {
			clearInterval(clock);
			window.removeEventListener('contextmenu', disable);
			window.removeEventListener('dblclick', disable);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('blur', onBlur);
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('keydown', onKeyDown);
		};
	});

	let splash = $state(true);
	post(() => (splash = false), 2000);
</script>

<Defs />
<Space />

<div id="app" class="nohi">
	{#if splash}
		<Splash />
	{:else}
		<div id="app-content" in:slideX={{ from: 100, duration: SPLASH_SLIDE_MS }} style="width: {DX}px; height: {DY}px; scale: {ss.scale};">
			<GamePage />
			<Home />
		</div>
	{/if}
</div>

<style>
	#app {
		position: relative;
		height: 100dvh;
		display: grid;
		place-content: center;
		box-sizing: border-box;
	}

	#app-content {
		grid-area: 1/1;
		place-self: center;
		display: grid;
		/* the pages waiting off to the side, and those sliding in or out, show only within it */
		overflow: hidden;
		touch-action: none;
		background: radial-gradient(ellipse at 50% 30%, hsl(var(--mono) 16% / 0.8), hsl(var(--mono) 8% / 0.9) 70%);
		box-shadow:
			0 0 0 1px hsl(var(--mono) 72% / 0.25),
			0 0 40px hsl(var(--mono) 45% / 0.25),
			inset 0 0 60px hsl(var(--mono) 0% / 0.5);
	}

	/* rounded only while it floats free, with room all round: the page never grows past 450 × 800, and in a window no
	   bigger it touches an edge, where rounded corners look cut off */
	@media (min-width: 451px) and (min-height: 801px) {
		#app-content {
			border-radius: 18px;
		}
	}
</style>
