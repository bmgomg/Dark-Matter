<script>
	import { shade } from './palette';
	import { ss } from './shared.svelte';

	// The night sky behind everything: nebulae and a fixed scatter of stars (seeded, so it's the same sky every time),
	// some of them twinkling. It has depth: the bigger a star, the nearer it is, and the faster it moves. The stars drift
	// slowly, now and then swinging round to a new heading, and the whole sky breathes, zooming slowly in and out. They
	// pan as the board turns, the way the tray's planets slide, and lean with the mouse. On a touch screen, or with
	// reduced motion, the sky stays still (a phone's page covers nearly all of it anyway, so it isn't worth the battery).

	// how far the nearest stars move, in the sky's units (it's 1000 across, on the window's longer side)
	const DRIFT = 10; // per second
	const TURN = 150; // per quarter turn of the board
	const LEAN = 30; // from the middle of the window to its edge
	// how quickly the sky catches up with a turn or the mouse, in ms: the higher, the softer
	const EASE_MS = 200;
	// a new heading every so often, at least this far round from the last, in degrees
	const HEADING_SECONDS = [20, 40];
	const HEADING_TURN = [60, 150];
	// how slowly the drift swings round to it, in ms: the higher, the slower
	const HEADING_EASE_MS = 3000;
	// breathing: how far the nearest stars zoom in, at most (it never goes below 1, which would show the sky's edge), and
	// how long a breath takes, about (two rhythms together, so no two breaths are quite alike)
	const BREATH = 0.12;
	const BREATH_SECONDS = 40;
	// the nebulae are far off: they only sway a little, lean a little (in px), and breathe a little
	const SWAY = 24;
	const SWAY_SECONDS = 90;
	const NEBULA_LEAN = 12;
	const NEBULA_BREATH = 0.04;
	// a jump of the board's angle that isn't a turn: a new puzzle, or another level's game resumed
	const JUMP = 45;

	const TWINKLE_SECONDS = 6;
	const TWINKLE_LOW = 0.1;

	const rand = (() => {
		let a = 20261103;
		return () => {
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	})();

	// most white, some a shade of the hue
	const TINTS = [shade(100), shade(100), shade(100), shade(92), shade(86), shade(80)];

	const stars = Array.from({ length: 260 }, (_, i) => {
		const r = 0.4 + rand() ** 3 * 1.6;

		return {
			i,
			x: rand() * 1000,
			y: rand() * 1000,
			r,
			// 0.15 the farthest to 1 the nearest
			depth: 0.15 + 0.85 * Math.sqrt((r - 0.4) / 1.6),
			o: 0.25 + rand() * 0.7,
			tint: TINTS[Math.floor(rand() * TINTS.length)],
			twinkle: rand() < 0.12,
			delay: rand() * TWINKLE_SECONDS
		};
	});

	const mod = (v, n) => ((v % n) + n) % n;

	let canvas = $state();
	let nebula = $state();

	$effect(() => {
		const ctx = canvas.getContext('2d');
		let w, h, scale;

		// where the view has got to, in units for the nearest stars
		let viewX = 0;
		let viewY = 0;
		// how far through a breath it is, 0 to 1
		let breath = 0;

		const draw = (seconds) => {
			ctx.clearRect(0, 0, w, h);

			for (const s of stars) {
				const grow = 1 + BREATH * breath * s.depth;
				const x = (mod(s.x + viewX * s.depth, 1000) - 500) * grow;
				const y = (mod(s.y + viewY * s.depth, 1000) - 500) * grow;
				const k = s.twinkle && seconds ? (1 - Math.cos((2 * Math.PI * (seconds + s.delay)) / TWINKLE_SECONDS)) / 2 : 0;

				ctx.globalAlpha = s.o + (TWINKLE_LOW - s.o) * k;
				ctx.fillStyle = s.tint;
				ctx.beginPath();
				ctx.arc(w / 2 + x * scale, h / 2 + y * scale, s.r * scale * grow, 0, 2 * Math.PI);
				ctx.fill();
			}
		};

		const still = matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches;

		const onResize = () => {
			const dpr = Math.min(2, devicePixelRatio || 1);

			w = innerWidth;
			h = innerHeight;
			scale = Math.max(w, h) / 1000;
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			if (still) {
				draw(0);
			}
		};

		onResize();
		window.addEventListener('resize', onResize);

		if (still) {
			return () => window.removeEventListener('resize', onResize);
		}

		// the mouse only: a finger on the screen is busy with the game, and its touch isn't where it's looking
		let leanX = 0;
		let leanY = 0;

		const onPointerMove = (e) => {
			if (e.pointerType === 'mouse') {
				leanX = (2 * e.clientX) / w - 1;
				leanY = (2 * e.clientY) / h - 1;
			}
		};

		window.addEventListener('pointermove', onPointerMove);

		// the board's turning, added up, so it goes on through a new puzzle's return to 0
		let angle;
		let turned = 0;
		let driftX = 0;
		let driftY = 0;
		let last;
		let frame;

		// the drift's heading, in radians, the one it's swinging round to, and when it next picks another
		const between = ([a, b]) => a + Math.random() * (b - a);
		let heading = Math.random() * 2 * Math.PI;
		let headingGoal = heading;
		let nextHeading = between(HEADING_SECONDS);

		const tick = (t) => {
			const seconds = t / 1000;
			const dt = Math.min(100, t - (last ?? t));
			const delta = ss.angle - (angle ?? ss.angle);

			last = t;
			angle = ss.angle;

			if (Math.abs(delta) < JUMP) {
				turned += delta;
			}

			if (seconds >= nextHeading) {
				nextHeading = seconds + between(HEADING_SECONDS);
				headingGoal = heading + ((Math.random() < 0.5 ? -1 : 1) * between(HEADING_TURN) * Math.PI) / 180;
			}

			heading += (headingGoal - heading) * (1 - Math.exp(-dt / HEADING_EASE_MS));
			driftX += (Math.cos(heading) * DRIFT * dt) / 1000;
			driftY += (Math.sin(heading) * DRIFT * dt) / 1000;

			// a turn clockwise takes the sky to the left, as it does the tray's planets
			const goalX = driftX - (turned / 90) * TURN - leanX * LEAN;
			const goalY = driftY - leanY * LEAN;
			const ease = 1 - Math.exp(-dt / EASE_MS);

			viewX += (goalX - viewX) * ease;
			viewY += (goalY - viewY) * ease;

			// from 0 to 1 and back, one slow rhythm with a slower one mixed in
			const wave =
				0.75 * Math.sin((2 * Math.PI * seconds) / BREATH_SECONDS) + 0.25 * Math.sin((2 * Math.PI * seconds) / (BREATH_SECONDS * 2.7));
			breath = (1 + wave) / 2;

			draw(seconds);

			const sway = SWAY * Math.sin((2 * Math.PI * seconds) / SWAY_SECONDS);
			const moved = `translate3d(${(sway - leanX * NEBULA_LEAN).toFixed(2)}px, ${(-leanY * NEBULA_LEAN).toFixed(2)}px, 0)`;
			nebula.style.transform = `${moved} scale(${(1 + NEBULA_BREATH * breath).toFixed(4)})`;

			frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onPointerMove);
		};
	});
</script>

<div class="space" aria-hidden="true">
	<div class="nebula" bind:this={nebula}></div>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.space {
		position: fixed;
		inset: 0;
		background: radial-gradient(ellipse at 50% 120%, hsl(var(--mono) 22%) 0%, hsl(var(--mono) 9%) 55%, hsl(var(--mono) 4%) 100%);
		pointer-events: none;
		overflow: hidden;
	}

	/* larger than the window by more than it ever moves, so its edges stay out of sight */
	.nebula {
		position: absolute;
		inset: -50px;
		background:
			radial-gradient(ellipse 60% 40% at 18% 22%, hsl(var(--mono) 45% / 0.33), transparent 70%),
			radial-gradient(ellipse 50% 35% at 85% 35%, hsl(var(--mono) 40% / 0.25), transparent 70%),
			radial-gradient(ellipse 70% 30% at 60% 85%, hsl(var(--mono) 62% / 0.19), transparent 70%),
			radial-gradient(ellipse 30% 20% at 75% 10%, hsl(var(--mono) 70% / 0.13), transparent 70%);
		filter: blur(10px);
		will-change: transform;
	}

	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
</style>
