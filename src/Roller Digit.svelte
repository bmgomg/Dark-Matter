<script>
	const { digit, dir } = $props();

	// The strip holds three copies of 0–9 and rests on the middle one; a change rolls in from the old digit's place in a
	// neighbouring copy, so it always rolls in dir, even across a wrap like 9 to 0.
	const BASE = 10;
	const COPIES = 3;
	const NUMERALS = Array.from({ length: COPIES * BASE }, (_, i) => i % BASE);
	const offset = (index) => `0 ${(-index / (COPIES * BASE)) * 100}%`;

	const ROLL_MS = 700;
	// eases out, going a touch past the digit and back
	const ease = (k) => 1 + 2 * (k - 1) ** 3 + (k - 1) ** 2;

	let strip;
	let shown;

	// By requestAnimationFrame, with the board's turn, rather than as a CSS or Web animation: on a Pixel 6a any animation
	// on the compositor, however light, made the turns stagger (37–44% of their frames late, whether the mask and the glow
	// were there or not).
	$effect(() => {
		const to = BASE + digit;
		const from = shown === undefined ? to : BASE + digit - dir * ((dir > 0 ? digit - shown + BASE : shown - digit + BASE) % BASE);

		shown = digit;

		if (from === to || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			strip.style.translate = offset(to);
			return;
		}

		let raf;
		let t0;

		const tick = (t) => {
			t0 ??= t;

			const k = Math.min(1, (t - t0) / ROLL_MS);

			strip.style.translate = offset(from + (to - from) * ease(k));

			if (k < 1) {
				raf = requestAnimationFrame(tick);
			}
		};

		strip.style.translate = offset(from);
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	});
</script>

<span class="digit" aria-hidden="true">
	<span bind:this={strip} class="strip" style:translate={offset(BASE + digit)}>
		{#each NUMERALS as n, i (i)}
			<span class="numeral">{n}</span>
		{/each}
	</span>
</span>

<style>
	/* Taller than its line, and wider than its numeral, by as much as its margins take back, so it takes no more room but
	   its clipping leaves the balance's glow alone. No fading mask at its ends: on a Pixel 6a it tripled the late frames
	   (7.8% against 2.5%); nor a fade-in, an animation on the compositor. */
	.digit {
		--height: 1.5em;
		--spare: 0.4em;

		display: grid;
		height: var(--height);
		margin-block: calc((1em - var(--height)) / 2);
		margin-inline: calc(-1 * var(--spare));
		padding-inline: var(--spare);
		overflow: clip;
	}

	.strip {
		display: grid;
	}

	.numeral {
		height: var(--height);
		line-height: var(--height);
		text-align: center;
	}
</style>
