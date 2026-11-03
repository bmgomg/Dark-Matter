<script>
	// The night sky behind everything: nebulae and a fixed scatter of stars (seeded, so it's the same sky every time),
	// some of them twinkling.
	const rand = (() => {
		let a = 20261103;
		return () => {
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	})();

	const TINTS = ['#ffffff', '#ffffff', '#ffffff', '#ffe9c4', '#c9d6ff', '#e6d6ff'];

	const stars = Array.from({ length: 260 }, (_, i) => ({
		i,
		x: rand() * 1000,
		y: rand() * 1000,
		r: 0.4 + rand() ** 3 * 1.6,
		o: 0.25 + rand() * 0.7,
		tint: TINTS[Math.floor(rand() * TINTS.length)],
		twinkle: rand() < 0.12,
		delay: rand() * 6
	}));
</script>

<div class="space" aria-hidden="true">
	<div class="nebula"></div>
	<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
		{#each stars as s (s.i)}
			<circle cx={s.x} cy={s.y} r={s.r} fill={s.tint} opacity={s.o} class:twinkle={s.twinkle} style="animation-delay: -{s.delay}s;" />
		{/each}
	</svg>
</div>

<style>
	.space {
		position: fixed;
		inset: 0;
		background: radial-gradient(ellipse at 50% 120%, #2a1b5e 0%, #0d0b24 55%, #05050f 100%);
		pointer-events: none;
	}

	.nebula {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 60% 40% at 18% 22%, #6b3fc255, transparent 70%),
			radial-gradient(ellipse 50% 35% at 85% 35%, #15808a40, transparent 70%),
			radial-gradient(ellipse 70% 30% at 60% 85%, #b06bff30, transparent 70%),
			radial-gradient(ellipse 30% 20% at 75% 10%, #ffb35c22, transparent 70%);
		filter: blur(10px);
	}

	svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.twinkle {
		animation: twinkle 6s ease-in-out infinite;
	}

	@keyframes twinkle {
		50% {
			opacity: 0.1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.twinkle {
			animation: none;
		}
	}
</style>
