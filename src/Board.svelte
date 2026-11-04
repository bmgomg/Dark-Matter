<script>
	import { cubicOut } from 'svelte/easing';
	import { MAP, R, SIDES } from './const';
	import { brushCursor } from './cursor';
	import Planet from './Planet.svelte';
	import { isOver, paint, sideAt, ss } from './shared.svelte';

	// The player's map, seen from above, the side they're viewing from at the bottom. It turns with the board,
	// following the swipe on the tray below; the planets on it stay upright, lit from the upper left.

	const HALF = MAP / 2;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const cell = $derived(MAP / N);
	const front = $derived(sideAt(ss.angle));
	const shown = $derived(pzl.over === 'revealed' ? pzl.sol : pzl.marks);
	const won = $derived(pzl.over === 'won');
	// the pointer over a cell: an arrow carrying the brush picked
	const cursor = $derived(brushCursor(ss.brush));

	// a point of the map turned with the board, clockwise on screen
	const turned = (x, y) => {
		const t = (ss.angle * Math.PI) / 180;
		const c = Math.cos(t);
		const s = Math.sin(t);
		return [x * c - y * s, x * s + y * c];
	};

	// a cell's center, row 0 the north row, column 0 the west column, before turning
	const center = (i, j) => [-HALF + (j + 0.5) * cell, -HALF + (i + 0.5) * cell];

	const cells = $derived(
		Array.from({ length: N * N }, (_, id) => {
			const i = Math.floor(id / N);
			const j = id % N;
			return { id, i, j };
		})
	);

	const marks = $derived.by(() => {
		const out = [];

		for (let i = 0; i < N; i++) {
			for (let j = 0; j < N; j++) {
				const v = shown[i][j];

				if (v > 0) {
					const [x, y] = turned(...center(i, j));
					out.push({ id: `${i}-${j}-${v}`, x, y, v, r: (R[v] / 100) * cell, delay: (i + j) * 60 });
				}
			}
		}

		return out;
	});

	// the plate's edge on the side facing the player, before turning: South, East, North, West
	const E = HALF + 8;
	const EDGES = [
		[-HALF, E, HALF, E],
		[E, -HALF, E, HALF],
		[-HALF, -E, HALF, -E],
		[-E, -HALF, -E, HALF]
	];
	const edge = $derived(EDGES[front]);

	// Showing the solution: the planets marked wrong shrink away and the true ones grow in their place, cell by cell
	// from the north-west corner; a cell marked right stays as it is. Marking and a new puzzle change over at once.
	const revealing = () => pzl.over === 'revealed';
	const GAP = 250;

	const grow = (node, { x, y, delay, duration }) =>
		revealing()
			? {
					delay,
					duration,
					easing: cubicOut,
					css: (t) => `transform: translate(${x}px, ${y}px) scale(${t}) translate(${-x}px, ${-y}px); opacity: ${Math.min(1, t * 2)};`
				}
			: { duration: 0 };

	const vanish = (node, { delay }) => (revealing() ? { delay, duration: 250, css: (t) => `opacity: ${t * 0.75};` } : { duration: 0 });

	const onClick = (e) => {
		const id = e.target.dataset?.cell;

		if (id !== undefined) {
			paint(Math.floor(id / N), id % N);
		}
	};
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<svg
	class="board"
	class:locked={isOver()}
	viewBox="-225 -175 450 350"
	role="grid"
	tabindex="-1"
	aria-label="Your map, viewed from the {SIDES[front]}. Tap a cell to mark it."
	style:--brush={cursor}
	onclick={onClick}
>
	<defs>
		<radialGradient id="cell-fill" cx="0.5" cy="0.45" r="0.75">
			<stop offset="0" stop-color="#4a43b8" stop-opacity="0.5" />
			<stop offset="1" stop-color="#211d5c" stop-opacity="0.8" />
		</radialGradient>
		<linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="-170" y1="-170" x2="170" y2="170">
			<stop offset="0" stop-color="#fff" stop-opacity="0" />
			<stop offset="0.44" stop-color="#fff" stop-opacity="0.06" />
			<stop offset="0.5" stop-color="#fff" stop-opacity="0.11" />
			<stop offset="0.56" stop-color="#fff" stop-opacity="0.04" />
			<stop offset="1" stop-color="#fff" stop-opacity="0" />
		</linearGradient>
	</defs>

	<g transform="rotate({ss.angle})">
		<rect x={-HALF - 8} y={-HALF - 8} width={MAP + 16} height={MAP + 16} rx="14" class="plate" />

		{#each cells as c (c.id)}
			{@const [x, y] = center(c.i, c.j)}
			<rect
				x={x - cell / 2 + 3}
				y={y - cell / 2 + 3}
				width={cell - 6}
				height={cell - 6}
				rx="7"
				class="cell"
				data-cell={c.id}
				role="gridcell"
				aria-label="Row {c.i + 1}, column {c.j + 1}"
			/>
			{#if shown[c.i][c.j] === 0 && pzl.over !== 'revealed'}
				{@const k = cell * 0.15}
				<path
					d="M{x - k} {y - k} L {x + k} {y + k} M {x + k} {y - k} L {x - k} {y + k}"
					class="cross"
					out:vanish={{ delay: (c.i + c.j) * 60 }}
				/>
			{/if}
		{/each}

		<line x1={edge[0]} y1={edge[1]} x2={edge[2]} y2={edge[3]} class="front" />
	</g>

	<rect
		x={-HALF - 8}
		y={-HALF - 8}
		width={MAP + 16}
		height={MAP + 16}
		rx="14"
		fill="url(#sheen)"
		class="nope"
		transform="rotate({ss.angle})"
	/>

	{#each marks as m (m.id)}
		<g in:grow={{ x: m.x, y: m.y, delay: m.delay + GAP, duration: 450 }} out:grow={{ x: m.x, y: m.y, delay: m.delay, duration: 250 }}>
			<Planet x={m.x} y={m.y} r={m.r} size={m.v} klass={won ? 'pulse' : ''} style="--delay: {m.delay}ms;" />
		</g>
	{/each}
</svg>

<style>
	.board {
		width: 450px;
		height: 350px;
		overflow: visible;
		outline: none;
	}

	.plate {
		fill: #15183f;
		stroke: #a99cff;
		stroke-width: 1.5;
		stroke-opacity: 0.7;
		filter: drop-shadow(0 0 8px #8f7bff88);
	}

	.cell {
		fill: url(#cell-fill);
		stroke: #8f86ff;
		stroke-width: 1;
		stroke-opacity: 0.5;
		cursor: var(--brush, pointer);
		transition: fill 0.15s;
	}

	@media (hover: hover) {
		.board:not(.locked) .cell:hover {
			fill: #5a4fe0;
		}
	}

	.locked .cell {
		cursor: default;
	}

	.cross {
		fill: none;
		stroke: #d8d2ff;
		stroke-width: 3.5;
		stroke-linecap: round;
		opacity: 0.75;
		pointer-events: none;
	}

	.front {
		stroke: #ffd77a;
		stroke-width: 3;
		stroke-linecap: round;
		filter: drop-shadow(0 0 5px #ffd77a);
		pointer-events: none;
	}

	.nope {
		pointer-events: none;
	}

	.board :global(.pulse) {
		animation: pulse 1.6s ease-in-out var(--delay) infinite;
	}

	@keyframes pulse {
		50% {
			filter: brightness(1.35) drop-shadow(0 0 6px #fff7);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.board :global(.pulse) {
			animation: none;
		}
	}
</style>
