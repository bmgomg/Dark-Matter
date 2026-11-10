<svelte:options namespace="svg" />

<script>
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { NAMES, R } from './const';
	import Planet from './Planet.svelte';
	import { mark, selMark } from './shared.svelte';

	// The palette at the selected cell, on the map: small, medium, large, clear, in a pill just above the cell (or
	// below it, near the map's top), with a notch pointing at it. It grows out of the cell. The cell's own planet is lit
	// and can't be picked again, and Clear can't be picked for a blank cell. x, y: the cell's centre on screen; id: the
	// cell's, so a move to another cell slides the picker over, while a turn of the board carries it along at once.
	const { x, y, cell, id } = $props();

	const SWATCHES = [1, 2, 3, 0];
	const S = 23; // a swatch's radius
	const GAP = 8;
	const PAD = 7;
	const W = SWATCHES.length * 2 * S + (SWATCHES.length - 1) * GAP + 2 * PAD;
	const H = 2 * S + 2 * PAD;
	const NOTCH = 8;
	// the svg's top and sides, in the map's coordinates
	const TOP = -175;
	const SIDE = 225;

	const current = $derived(selMark());
	const idle = (v) => (v ? v === current : current < 1);

	// where it goes: above the cell, or below it near the map's top; tip: the notch's tip, at the cell's edge
	const goal = $derived.by(() => {
		const above = y - cell / 2 - NOTCH - H >= TOP - 6;
		const tip = above ? y - cell / 2 + 4 : y + cell / 2 - 4;
		const left = Math.max(-SIDE + 4, Math.min(SIDE - 4 - W, x - W / 2));
		return { tip, top: above ? tip - NOTCH - H : tip + NOTCH, left, x };
	});

	const MOVE_MS = 220;
	const at = new Tween(
		untrack(() => goal),
		{ duration: MOVE_MS, easing: cubicOut }
	);
	let lastId = untrack(() => id);

	$effect(() => {
		const moved = id !== lastId;
		lastId = id;
		at.set(goal, { duration: moved ? MOVE_MS : 0 });
	});

	const tip = $derived(at.current.tip);
	const top = $derived(at.current.top);
	const left = $derived(at.current.left);
	// the notch: its two sides, and its fill, which reaches into the pill to cover the pill's edge there; it stays
	// within the pill's straight stretch, and points the way the pill lies from its tip
	const above = $derived(top < tip);
	const nx = $derived(Math.max(left + H / 2, Math.min(left + W - H / 2, at.current.x)));
	const base = $derived(above ? top + H : top);
	const inside = $derived(above ? base - 3 : base + 3);
	const sides = $derived(`M${nx - NOTCH} ${base} L${nx} ${tip} L${nx + NOTCH} ${base}`);
	const fill = $derived(
		`M${nx - NOTCH - 1} ${inside} L${nx - NOTCH} ${base} L${nx} ${tip} L${nx + NOTCH} ${base} L${nx + NOTCH + 1} ${inside} Z`
	);

	const pop = () => ({
		duration: 180,
		easing: cubicOut,
		css: (t) => `transform: translate(${x}px, ${tip}px) scale(${0.6 + 0.4 * t}) translate(${-x}px, ${-tip}px); opacity: ${t};`
	});

	const pick = (e, v) => {
		e.stopPropagation();

		if (!idle(v)) {
			mark(v);
		}
	};
</script>

<g class="picker" transition:pop role="group" aria-label="Mark the cell">
	<rect x={left} y={top} width={W} height={H} rx={H / 2} class="body" />
	<path d={fill} class="notch-fill" />
	<path d={sides} class="notch" />

	{#each SWATCHES as v, k (v)}
		{@const cx = left + PAD + S + k * (2 * S + GAP)}
		{@const cy = top + H / 2}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<g
			class="swatch"
			class:picked={v && v === current}
			class:idle={idle(v)}
			role="button"
			tabindex="-1"
			aria-label={NAMES[v]}
			aria-disabled={idle(v)}
			onclick={(e) => pick(e, v)}
		>
			<circle {cx} {cy} r={S} class="ring" />
			{#if v}
				<Planet x={cx} y={cy} r={(R[v] / R[3]) * (S - 5)} size={v} />
			{:else}
				<path d="M{cx - 7} {cy - 7} L {cx + 7} {cy + 7} M {cx + 7} {cy - 7} L {cx - 7} {cy + 7}" class="cross" />
			{/if}
		</g>
	{/each}
</g>

<style>
	.picker {
		filter: drop-shadow(0 6px 14px hsl(var(--mono) 0% / 0.8));
	}

	.body {
		fill: hsl(var(--mono) 12%);
		stroke: hsl(var(--mono) 98%);
		stroke-opacity: 0.6;
		stroke-width: 1.5;
	}

	.notch-fill {
		fill: hsl(var(--mono) 12%);
	}

	.notch {
		fill: none;
		stroke: hsl(var(--mono) 98%);
		stroke-opacity: 0.6;
		stroke-width: 1.5;
		stroke-linejoin: round;
	}

	.swatch {
		cursor: pointer;
		outline: none;
	}

	.ring {
		fill: hsl(var(--mono) 100% / 0.04);
		stroke: hsl(var(--mono) 72%);
		stroke-opacity: 0.35;
		stroke-width: 1.5;
		transition:
			stroke 0.15s,
			stroke-opacity 0.15s,
			fill 0.15s;
	}

	.swatch:not(.idle):hover .ring {
		stroke-opacity: 0.9;
		fill: hsl(var(--mono) 100% / 0.08);
	}

	.swatch.idle {
		cursor: default;
	}

	.swatch.idle:not(.picked) {
		opacity: 0.3;
	}

	.picked .ring {
		fill: hsl(var(--mono) 98% / 0.1);
		stroke: hsl(var(--mono) 98%);
		stroke-opacity: 1;
		stroke-width: 2.5;
	}

	.cross {
		stroke: hsl(var(--mono) 84%);
		stroke-width: 3.5;
		stroke-linecap: round;
	}
</style>
