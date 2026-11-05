<script>
	import Defs from '../Defs.svelte';
	import GamePage from '../Game Page.svelte';
	import Home from '../Home.svelte';
	import Space from '../Space.svelte';
	import Splash from '../Splash.svelte';
	import { DX, DY } from '../const';
	import { deselect, mark, ss, toggleKeys, turnBy } from '../shared.svelte';
	import { _sound } from '../sound.svelte';
	import { clientRect, post } from '../utils';

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

		// ← → turn the board (as a swipe that way); with a cell selected, 1 2 3 place a planet, 0 (or Delete) clears it,
		// Esc puts the palette away; ? shows the shortcuts (Keys.svelte), and any key puts them away
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
			} else if (ss.sel && !ss.prompt && ['0', '1', '2', '3'].includes(e.key)) {
				mark(+e.key);
			} else if (ss.sel && !ss.prompt && ['Delete', 'Backspace'].includes(e.key)) {
				mark(0);
			} else if (ss.sel && e.key === 'Escape') {
				deselect();
			} else {
				return;
			}

			e.preventDefault();
		};

		onResize();

		window.addEventListener('contextmenu', disable);
		window.addEventListener('dblclick', disable);
		window.addEventListener('resize', onResize);
		window.addEventListener('blur', onBlur);
		window.addEventListener('focus', onFocus);
		window.addEventListener('keydown', onKeyDown);

		return () => {
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
		<div id="app-content" style="width: {DX}px; height: {DY}px; scale: {ss.scale};">
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
		touch-action: none;
		background: radial-gradient(ellipse at 50% 30%, #1a1442cc, #0a0920e6 70%);
		box-shadow:
			0 0 0 1px #8f86ff40,
			0 0 40px #6b40c240,
			inset 0 0 60px #00000080;
	}

	/* rounded only while it floats free, with room all round: the page never grows past 450 × 800, and in a window no
	   bigger it touches an edge, where rounded corners look cut off */
	@media (min-width: 451px) and (min-height: 801px) {
		#app-content {
			border-radius: 18px;
		}
	}
</style>
