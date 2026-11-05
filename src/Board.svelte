<script>
	import { cubicOut } from 'svelte/easing';
	import { FLIP_PERSPECTIVE, MAP, NAMES, PALETTE_AT_CELL, R, SIDES } from './const';
	import Picker from './Picker.svelte';
	import Planet from './Planet.svelte';
	import { deselect, hideCursor, isOver, select, showCursor, sideAt, ss } from './shared.svelte';

	// The player's map, seen from above, the side they're viewing from at the bottom. It turns with the board,
	// following the swipe on the tray below; the planets on it stay upright, lit from the upper left.

	const HALF = MAP / 2;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const cell = $derived(MAP / N);
	const front = $derived(sideAt(ss.angle));
	const shown = $derived(pzl.over === 'revealed' ? pzl.sol : pzl.marks);
	const won = $derived(pzl.over === 'won');
	// the cell being marked, pulsing while the palette is up
	const sel = $derived(ss.sel ? ss.sel[0] * N + ss.sel[1] : -1);
	// the keyboard's cell, while it shows (shared.svelte.js); a selected cell has a look of its own
	const cursor = $derived(ss.cursorOn && ss.cursor ? ss.cursor[0] * N + ss.cursor[1] : -1);

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

	// the selected cell's centre on screen, for the picker beside it
	// (kept once the cell is let go, for the picker to fade out where it was)
	let lastAt = [0, 0];
	const selAt = $derived(ss.sel ? turned(...center(ss.sel[0], ss.sel[1])) : null);
	const at = $derived.by(() => {
		if (selAt) {
			lastAt = selAt;
		}

		return lastAt;
	});

	// a tap anywhere off the map lets the selected cell go, as with any popover
	$effect(() => {
		const onDown = (e) => {
			if (ss.sel && !e.target.closest?.('.board')) {
				deselect();
			}
		};

		document.addEventListener('pointerdown', onDown);
		return () => document.removeEventListener('pointerdown', onDown);
	});

	// a tap on a cell selects it (or lets it go); a tap elsewhere on the map lets the selected one go
	const onClick = (e) => {
		const id = e.target.dataset?.cell;

		if (id !== undefined) {
			select(Math.floor(id / N), id % N);
		} else if (ss.sel) {
			deselect();
		}
	};

	// the cursor shows for the keyboard's focus, not a pointer's
	const onFocus = (e) => {
		if (e.target.matches(':focus-visible')) {
			showCursor();
		}
	};
</script>

<div class="flipper">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<svg
		class="board"
		class:locked={isOver()}
		viewBox="-225 -175 450 350"
		style:transform={ss.flip ? `perspective(${FLIP_PERSPECTIVE}px) rotateX(${ss.flip * 90}deg)` : null}
		role="grid"
		tabindex={isOver() ? -1 : 0}
		aria-label="Your map, viewed from the {SIDES[front]}. Tap a cell to mark it."
		aria-activedescendant={cursor < 0 ? null : `cell-${cursor}`}
		onclick={onClick}
		onfocus={onFocus}
		onblur={hideCursor}
		onpointerdown={hideCursor}
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
					class:sel={c.id === sel}
					id="cell-{c.id}"
					data-cell={c.id}
					role="gridcell"
					aria-label="Row {c.i + 1}, column {c.j + 1}: {shown[c.i][c.j] > 0 ? NAMES[shown[c.i][c.j]] + ' planet' : 'blank'}"
				/>
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
				<g class:beat={won} style="--delay: {m.delay}ms;">
					<Planet x={m.x} y={m.y} r={m.r} size={m.v} klass={won ? 'pulse' : ''} style="--delay: {m.delay}ms;" />
				</g>
			</g>
		{/each}

		<!-- over the planets, so a large one can't hide it -->
		{#if cursor >= 0 && cursor !== sel}
			{@const [x, y] = center(ss.cursor[0], ss.cursor[1])}
			<rect
				x={x - cell / 2 + 3}
				y={y - cell / 2 + 3}
				width={cell - 6}
				height={cell - 6}
				rx="7"
				class="cursor nope"
				transform="rotate({ss.angle})"
			/>
		{/if}

		{#if PALETTE_AT_CELL && selAt && !isOver()}
			<Picker x={at[0]} y={at[1]} {cell} id={ss.sel ? ss.sel[0] * N + ss.sel[1] : -1} />
		{/if}
	</svg>

	<!-- A flip tips the near edge towards the player. This is the plate's thickness on that edge: square to the map, so
	     unseen while it's flat, and full on when it's edge-on, when the map itself has no height left to show. -->
	{#if ss.flip}
		<div
			class="rim"
			style:width="{MAP + 3}px"
			style:transform="perspective({FLIP_PERSPECTIVE}px) rotateX({ss.flip * 90}deg) translateY({E}px) rotateX(-90deg)"
		></div>
	{/if}
</div>

<style>
	/* the map and the rim, one over the other, with one centre to flip about */
	.flipper {
		display: grid;
		place-items: center;
	}

	.board,
	.rim {
		grid-area: 1 / 1;
	}

	.board {
		width: 450px;
		height: 350px;
		overflow: visible;
		outline: none;
	}

	.rim {
		height: 5px;
		border-radius: 3px;
		background: #ffd77a;
		box-shadow: 0 0 10px #ffd77a;
		pointer-events: none;
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
		cursor: pointer;
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

	/* the cell being marked */
	.board .cell.sel {
		fill: #5a4fe0;
		stroke: #ffd77a;
		stroke-opacity: 1;
		stroke-width: 2.5;
		animation: sel 0.9s ease-in-out infinite alternate;
	}

	@keyframes sel {
		from {
			filter: drop-shadow(0 0 2px #ffd77a88);
		}
		to {
			filter: drop-shadow(0 0 9px #ffd77a);
			stroke-width: 3.5;
		}
	}

	/* the keyboard's cell: white, as the selected one is gold */
	.cursor {
		fill: #ffffff14;
		stroke: #fff;
		stroke-width: 2.5;
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

	/* a win: each planet swells three times, in a wave from the north-west corner, at an even pace */
	.beat {
		transform-box: fill-box;
		transform-origin: center;
		animation: beat 0.5s linear var(--delay) 3;
	}

	@keyframes beat {
		50% {
			transform: scale(1.22);
		}
	}

	@keyframes pulse {
		50% {
			filter: brightness(1.35) drop-shadow(0 0 6px #fff7);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.board :global(.pulse),
		.board .cell.sel,
		.beat {
			animation: none;
		}
	}
</style>
