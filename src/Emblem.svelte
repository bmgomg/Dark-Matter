<script>
	import Planet from './Planet.svelte';

	// A total eclipse, with the three planets on a tilted orbit around it, passing behind and in front.
	const RX = 150;
	const RY = 34;
	const ORBIT = [
		{ size: 1, r: 9, phase: 0 },
		{ size: 2, r: 14, phase: 2.1 },
		{ size: 3, r: 20, phase: 4.2 }
	];

	let t = $state(0.6);

	$effect(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		let raf;
		let t0;

		const tick = (now) => {
			t0 ??= now - t * 1000 * 9;
			t = (now - t0) / 1000 / 9;
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// sin > 0: the near half of the orbit; nearer is a little bigger
	const bodies = $derived(
		ORBIT.map((b) => {
			const a = t * Math.PI * 2 + b.phase;
			const near = Math.sin(a);
			return { ...b, x: Math.cos(a) * RX, y: near * RY + 4, k: 1 + near * 0.12, near: near > 0 };
		})
	);
</script>

<svg class="emblem" viewBox="-200 -110 400 220" aria-hidden="true">
	<defs>
		<radialGradient id="corona">
			<stop offset="0.5" stop-color="#fff8e6" stop-opacity="1" />
			<stop offset="0.56" stop-color="#ffe2a0" stop-opacity="0.85" />
			<stop offset="0.7" stop-color="#ffb35c" stop-opacity="0.35" />
			<stop offset="1" stop-color="#b06bff" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="moon-dark" cx="0.4" cy="0.35" r="0.75">
			<stop offset="0" stop-color="#1c1838" />
			<stop offset="1" stop-color="#05040e" />
		</radialGradient>
	</defs>

	<path d="M {-RX} 4 A {RX} {RY} 0 0 1 {RX} 4" class="orbit" />
	{#each bodies.filter((b) => !b.near) as b (b.size)}
		<Planet x={b.x} y={b.y} r={b.r * b.k} size={b.size} />
	{/each}

	<g class="rays">
		{#each { length: 18 }, k (k)}
			<line x1="0" y1="-62" x2="0" y2={k % 2 ? -92 : -104} transform="rotate({k * 20})" />
		{/each}
	</g>
	<circle r="104" fill="url(#corona)" class="corona" />
	<circle r="52" fill="url(#moon-dark)" />
	<circle r="52" fill="none" stroke="#fff4dc" stroke-width="1.2" stroke-opacity="0.8" />
	<!-- the diamond ring: the last of the sun, at the moon's edge -->
	<circle cx="36" cy="-37.5" r="3.2" fill="#fff" class="diamond" />

	<path d="M {RX} 4 A {RX} {RY} 0 0 1 {-RX} 4" class="orbit" />
	{#each bodies.filter((b) => b.near) as b (b.size)}
		<Planet x={b.x} y={b.y} r={b.r * b.k} size={b.size} />
	{/each}
</svg>

<style>
	.emblem {
		width: 400px;
		height: 220px;
		overflow: visible;
	}

	.orbit {
		fill: none;
		stroke: #b8b0ff;
		stroke-opacity: 0.35;
		stroke-width: 1;
		stroke-dasharray: 3 5;
	}

	.rays {
		stroke: #ffe2a0;
		stroke-opacity: 0.3;
		stroke-width: 1.5;
		stroke-linecap: round;
		transform-origin: 0 0;
		animation: spin 80s linear infinite;
	}

	.corona {
		animation: breathe 6s ease-in-out infinite;
		transform-origin: 0 0;
	}

	.diamond {
		filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 10px #ffe2a0);
		animation: glint 4s ease-in-out infinite;
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}

	@keyframes breathe {
		50% {
			scale: 1.04;
			opacity: 0.9;
		}
	}

	@keyframes glint {
		50% {
			opacity: 0.55;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rays,
		.corona,
		.diamond {
			animation: none;
		}
	}
</style>
