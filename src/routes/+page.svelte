<script>
	import Defs from '../Defs.svelte';
	import GamePage from '../Game Page.svelte';
	import Home from '../Home.svelte';
	import Space from '../Space.svelte';
	import Splash from '../Splash.svelte';
	import { DX, DY } from '../const';
	import { onDone, ss, turnBy } from '../shared.svelte';
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

		// ← → turn the board (as a swipe that way), 1 2 3 pick a planet, 0 an empty mark, Enter is Done
		const onKeyDown = (e) => {
			if (ss.home || e.ctrlKey || e.metaKey || e.altKey) {
				return;
			}

			if (e.key === 'ArrowLeft') {
				turnBy(1);
			} else if (e.key === 'ArrowRight') {
				turnBy(-1);
			} else if (['0', '1', '2', '3'].includes(e.key)) {
				ss.brush = +e.key;
			} else if (e.key === 'Enter' && !ss.prompt && !e.target.closest?.('[role=button]')) {
				onDone();
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
		border-radius: 18px;
		background: radial-gradient(ellipse at 50% 30%, #1a1442cc, #0a0920e6 70%);
		box-shadow:
			0 0 0 1px #8f86ff40,
			0 0 40px #6b40c240,
			inset 0 0 60px #00000080;
	}
</style>
