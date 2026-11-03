<script>
	import { R, SIDES, SWIPE_PX } from './const';
	import Planet from './Planet.svelte';
	import { isOver, paint, persistCommon, spinTo, ss, stopTurning } from './shared.svelte';
	import { BOARD, facing, project, sideAt, turned } from './view3d';

	// how thick the board is, in world units
	const THICK = 0.3;
	const H = BOARD / 2;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const cell = $derived(BOARD / N);
	const angle = $derived(ss.angle);
	const front = $derived(sideAt(angle));
	const shown = $derived(pzl.over === 'revealed' ? pzl.sol : pzl.marks);
	const won = $derived(pzl.over === 'won');

	const at = (x, y, z = 0) => {
		const [tx, ty] = turned(x, y, angle);
		return project([tx, ty, z]);
	};

	const pts = (list) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

	// a cell's floor, a little inside its edges; row 0 is the north row, column 0 the west column
	const cellXY = (i, j) => [-H + (j + 0.5) * cell, H - (i + 0.5) * cell];

	const cells = $derived.by(() => {
		const out = [];
		const k = cell * 0.46;

		for (let i = 0; i < N; i++) {
			for (let j = 0; j < N; j++) {
				const [x, y] = cellXY(i, j);
				const poly = pts([at(x - k, y - k), at(x + k, y - k), at(x + k, y + k), at(x - k, y + k)]);
				const wrong = pzl.wrong.some(([a, b]) => a === i && b === j);
				out.push({ id: i * N + j, i, j, poly, wrong });
			}
		}

		return out;
	});

	// the board's top and its sides, the far sides hidden behind it
	const slab = $derived.by(() => {
		const corners = [
			[-H, -H],
			[H, -H],
			[H, H],
			[-H, H]
		];
		const top = corners.map(([x, y]) => at(x, y));
		const sides = [];

		for (let k = 0; k < 4; k++) {
			const [x0, y0] = corners[k];
			const [x1, y1] = corners[(k + 1) % 4];
			const mid = turned((x0 + x1) / 2, (y0 + y1) / 2, angle);
			const normal = [mid[0] / H, mid[1] / H, 0];

			if (facing(normal, [mid[0], mid[1], -THICK / 2])) {
				const face = [at(x0, y0), at(x1, y1), at(x1, y1, -THICK), at(x0, y0, -THICK)];
				// sides lit from the left are lighter
				sides.push({ k, poly: pts(face), light: 0.5 - normal[0] * 0.35 });
			}
		}

		return { top: pts(top), sides };
	});

	// the compass letters, just outside each side's middle; the side facing the player is the bright one
	const letters = $derived(
		[
			[0, -1.13],
			[1.13, 0],
			[0, 1.13],
			[-1.13, 0]
		].map(([x, y], k) => ({ k, p: at(x * H, y * H), name: SIDES[k][0] }))
	);

	// the marks, planets and crosses, drawn far to near
	const items = $derived.by(() => {
		const out = [];

		for (let i = 0; i < N; i++) {
			for (let j = 0; j < N; j++) {
				const v = shown[i][j];

				if (v < 0 || (v === 0 && pzl.over === 'revealed')) {
					continue;
				}

				const [x, y] = cellXY(i, j);

				if (v === 0) {
					const k = cell * 0.17;
					const d = at(x, y).d;
					out.push({ id: `x${i}-${j}`, d, cross: [pts([at(x - k, y - k), at(x + k, y + k)]), pts([at(x + k, y - k), at(x - k, y + k)])] });
					continue;
				}

				const r = (R[v] / 100) * cell;
				const [tx, ty] = turned(x, y, angle);
				const c = project([tx, ty, r]);
				const g = project([tx, ty, 0]);
				out.push({ id: `p${i}-${j}`, d: c.d, v, c, g, r: r * c.s, delay: (i + j) * 60 });
			}
		}

		return out.sort((a, b) => b.d - a.d);
	});

	// a press on the board is a tap (marks the cell) unless it moves far enough to be a swipe (turns the board)
	let drag = null;

	const onPointerDown = (e) => {
		if (drag) {
			return;
		}

		stopTurning();
		e.currentTarget.setPointerCapture(e.pointerId);
		const id = e.target.dataset?.cell;
		drag = { id: id === undefined ? null : +id, x0: e.clientX, a0: ss.angle, moved: false, last: [[e.clientX, performance.now()]] };
	};

	const onPointerMove = (e) => {
		if (!drag) {
			return;
		}

		const dx = (e.clientX - drag.x0) / ss.scale;

		if (!drag.moved && Math.abs(dx) > 10) {
			drag.moved = true;
		}

		if (drag.moved) {
			// the finger pulls the near edge: to the right turns the board counterclockwise
			ss.angle = drag.a0 - (dx * 90) / SWIPE_PX;
			drag.last = [...drag.last.slice(-4), [e.clientX, performance.now()]];
		}
	};

	const onPointerUp = () => {
		if (!drag) {
			return;
		}

		const { id, moved, last } = drag;
		drag = null;

		if (!moved) {
			if (id !== null) {
				paint(Math.floor(id / N), id % N);
			}

			spinTo(Math.round(ss.angle / 90));
			return;
		}

		if (!ss.swiped) {
			ss.swiped = true;
			persistCommon();
		}

		// a flick goes on to the next quarter in its direction; a slow drag settles on the nearest
		const [[x0, t0], [x1, t1]] = [last[0], last.at(-1)];
		const v = (x1 - x0) / ss.scale / Math.max(1, t1 - t0);
		const q = ss.angle / 90;
		const step = Math.abs(v) > 0.35 ? (v > 0 ? Math.floor(q) : Math.ceil(q)) : Math.round(q);

		spinTo(step);
	};
</script>

<svg
	class="board"
	class:locked={isOver()}
	class:won
	viewBox="-225 -128 450 300"
	role="application"
	aria-label="The board, from the {SIDES[front]}. Swipe to turn it, tap a cell to mark it."
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<defs>
		<linearGradient id="slab-top" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#15183f" />
			<stop offset="1" stop-color="#2e2a78" />
		</linearGradient>
		<!-- a sheen across the glass, fixed to the light, not the board -->
		<linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="-200" y1="-120" x2="160" y2="170">
			<stop offset="0" stop-color="#fff" stop-opacity="0" />
			<stop offset="0.42" stop-color="#fff" stop-opacity="0.07" />
			<stop offset="0.5" stop-color="#fff" stop-opacity="0.13" />
			<stop offset="0.58" stop-color="#fff" stop-opacity="0.05" />
			<stop offset="1" stop-color="#fff" stop-opacity="0" />
		</linearGradient>
		<radialGradient id="cell-fill" cx="0.5" cy="0.5" r="0.7">
			<stop offset="0" stop-color="#4a43b8" stop-opacity="0.55" />
			<stop offset="1" stop-color="#231f63" stop-opacity="0.75" />
		</radialGradient>
		<linearGradient id="slab-side" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6f63e6" />
			<stop offset="1" stop-color="#1d1850" />
		</linearGradient>
		<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur stdDeviation="3" />
		</filter>
		<radialGradient id="under">
			<stop offset="0" stop-color="#6a4bd1" stop-opacity="0.45" />
			<stop offset="1" stop-color="#6a4bd1" stop-opacity="0" />
		</radialGradient>
	</defs>

	<!-- a pool of light under the board -->
	<ellipse cx="0" cy="40" rx="250" ry="120" fill="url(#under)" opacity="0.5" class="nope" />

	{#each slab.sides as side (side.k)}
		<polygon points={side.poly} class="side" class:front={side.k === front} style="fill-opacity: {0.55 + side.light * 0.4};" />
	{/each}
	<polygon points={slab.top} class="top-glow" filter="url(#glow)" />
	<polygon points={slab.top} class="top" />

	{#each cells as c (c.id)}
		<polygon points={c.poly} class="cell" class:wrong={c.wrong} data-cell={c.id} />
	{/each}
	<polygon points={slab.top} fill="url(#sheen)" class="nope" />

	{#each letters as l (l.k)}
		<text x={l.p.x} y={l.p.y} class="letter" class:front={l.k === front} style="font-size: {l.p.s * 0.24}px;">{l.name}</text>
	{/each}

	{#each items as it (it.id)}
		{#if it.cross}
			<g class="cross">
				{#each it.cross as line, k (k)}
					<polyline points={line} />
				{/each}
			</g>
		{:else}
			<ellipse cx={it.g.x} cy={it.g.y} rx={it.r * 0.95} ry={it.r * 0.62} fill="url(#contact)" class="nope" />
			<Planet x={it.c.x} y={it.c.y} r={it.r} size={it.v} klass={won ? 'pulse' : ''} style="--delay: {it.delay}ms;" />
		{/if}
	{/each}
</svg>

<style>
	.board {
		width: 450px;
		height: 300px;
		overflow: visible;
		touch-action: none;
		cursor: grab;
	}

	.board:active {
		cursor: grabbing;
	}

	.side {
		fill: url(#slab-side);
		stroke: #8f86ff;
		stroke-width: 0.8;
		stroke-opacity: 0.5;
	}

	.side.front {
		stroke: #ffd77a;
		stroke-opacity: 0.9;
		filter: drop-shadow(0 0 5px #ffd77a88);
	}

	.top {
		fill: url(#slab-top);
		stroke: #a99cff;
		stroke-width: 1.2;
		stroke-opacity: 0.7;
	}

	.top-glow {
		fill: none;
		stroke: #8f7bff;
		stroke-width: 6;
		opacity: 0.6;
	}

	.cell {
		fill: url(#cell-fill);
		stroke: #8f86ff;
		stroke-width: 1;
		stroke-opacity: 0.55;
		transition: fill 0.15s;
	}

	@media (hover: hover) {
		.board:not(.locked) .cell:hover {
			fill: #5a4fe0;
		}
	}

	.cell.wrong {
		stroke: #ff6b7d;
		stroke-width: 3;
		stroke-opacity: 1;
		filter: drop-shadow(0 0 4px #ff6b7d);
	}

	.letter {
		font-family: SM;
		fill: #b8b0ff;
		opacity: 0.55;
		text-anchor: middle;
		dominant-baseline: central;
		pointer-events: none;
	}

	.letter.front {
		fill: #ffd77a;
		opacity: 1;
	}

	.cross {
		fill: none;
		stroke: #d8d2ff;
		stroke-width: 3;
		stroke-linecap: round;
		opacity: 0.75;
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
