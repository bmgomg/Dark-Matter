<script>
	import { MAP, R, SIDES, SWIPE_PX } from './const';
	import { elevation } from './logic';
	import Icon from './Icon.svelte';
	import Planet from './Planet.svelte';
	import { persistCommon, sideAt, spinTo, ss, stopTurning, turnBy } from './shared.svelte';

	// The view from the player's seat, edge-on: the tray the planets stand on, each lane showing the planets
	// that peek over the ones in front. Swiping it turns the board: the planets slide along with the finger and off
	// the tray's end, and the next side's lineup slides in from the other end, all at one speed, so no depth shows.

	const H = 96;
	const GROUND = 86;
	const HALF = MAP / 2;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const lane = $derived(MAP / N);
	const side = $derived(sideAt(ss.angle));

	const mod4 = (k) => ((k % 4) + 4) % 4;

	// the lineup a side shows, shifted along the tray by dx
	const lineup = (s, dx) => {
		const out = [];

		elevation(pzl.sol, s).forEach((visible, c) => {
			const x = -HALF + (c + 0.5) * lane + dx;

			// back to front, so the nearer ones are drawn over the ones they stand before
			for (let k = visible.length - 1; k >= 0; k--) {
				const v = visible[k];
				const r = (R[v] / 100) * lane;
				out.push({ id: `${s}-${c}-${k}`, x, r, v, y: GROUND - r + ss.rise * (2 * r + 10) });
			}
		});

		return out;
	};

	// turning clockwise (a swipe to the left) moves this side's lineup off to the left and brings the next in from the right
	const planets = $derived.by(() => {
		const q = ss.angle / 90;
		const b = Math.floor(q);
		const f = q - b;
		return f < 1e-6 ? lineup(mod4(b), 0) : [...lineup(mod4(b), -f * SWIPE_PX), ...lineup(mod4(b + 1), (1 - f) * SWIPE_PX)];
	});

	// a drag along the tray turns the board with it; a flick goes on to the next quarter, a slow drag settles on the nearest
	let drag = null;

	const onPointerDown = (e) => {
		if (drag || !pzl || e.target.closest('button')) {
			return;
		}

		stopTurning();
		e.currentTarget.setPointerCapture(e.pointerId);
		drag = { x0: e.clientX, a0: ss.angle, moved: false, last: [[e.clientX, performance.now()]] };
	};

	const onPointerMove = (e) => {
		if (!drag) {
			return;
		}

		const dx = (e.clientX - drag.x0) / ss.scale;

		if (!drag.moved && Math.abs(dx) > 6) {
			drag.moved = true;
		}

		if (drag.moved) {
			ss.angle = drag.a0 - (dx * 90) / SWIPE_PX;
			drag.last = [...drag.last.slice(-4), [e.clientX, performance.now()]];
		}
	};

	const onPointerUp = () => {
		if (!drag) {
			return;
		}

		const { moved, last } = drag;
		drag = null;

		if (!moved) {
			spinTo(Math.round(ss.angle / 90));
			return;
		}

		if (!ss.swiped) {
			ss.swiped = true;
			persistCommon();
		}

		const [[x0, t0], [x1, t1]] = [last[0], last.at(-1)];
		const v = (x1 - x0) / ss.scale / Math.max(1, t1 - t0);
		const q = ss.angle / 90;

		spinTo(Math.abs(v) > 0.3 ? (v > 0 ? Math.floor(q) : Math.ceil(q)) : Math.round(q));
	};
</script>

<div
	class="tray"
	role="slider"
	tabindex="-1"
	aria-label="The board edge-on, from the {SIDES[side]}. Swipe to turn the board."
	aria-valuenow={side}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerUp}
>
	<svg viewBox="-225 0 450 {H}" aria-hidden="true">
		<defs>
			<radialGradient id="dawn" cx="0.5" cy="1" r="0.5">
				<stop offset="0" stop-color="#ffcf7a" stop-opacity="0.3" />
				<stop offset="0.6" stop-color="#ff9f6a" stop-opacity="0.1" />
				<stop offset="1" stop-color="#b06bff" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#8f86ff" stop-opacity="0" />
				<stop offset="0.2" stop-color="#8f86ff" stop-opacity="0.45" />
				<stop offset="0.8" stop-color="#8f86ff" stop-opacity="0.45" />
				<stop offset="1" stop-color="#8f86ff" stop-opacity="0" />
			</linearGradient>
			<!-- the planets show only over the tray, and above it -->
			<clipPath id="on-tray">
				<rect x={-HALF - 14} y="-40" width={MAP + 28} height={GROUND + 40} />
			</clipPath>
		</defs>

		<ellipse cx="0" cy={GROUND} rx={HALF + 40} ry="56" fill="url(#dawn)" clip-path="url(#on-tray)" />

		{#each { length: N - 1 }, c (c)}
			{@const x = -HALF + (c + 1) * lane}
			<line x1={x} y1="20" x2={x} y2={GROUND} class="lane" />
		{/each}

		<g clip-path="url(#on-tray)">
			{#each planets as p (p.id)}
				<Planet x={p.x} y={p.y} r={p.r} size={p.v} />
			{/each}
		</g>

		<!-- the tray: the board's edge as a 2D being sees it, a faint line -->
		<rect x={-HALF - 30} y={GROUND} width={MAP + 60} height="1" fill="url(#edge)" />
	</svg>

	<!-- as a swipe that way: the left one turns the board clockwise, the right one counterclockwise -->
	<button class="turn left" aria-label="Turn the board clockwise" aria-keyshortcuts="ArrowLeft" onclick={() => turnBy(1)}>
		<Icon name="left" />
	</button>
	<button class="turn right" aria-label="Turn the board counterclockwise" aria-keyshortcuts="ArrowRight" onclick={() => turnBy(-1)}>
		<Icon name="right" />
	</button>
</div>

<style>
	.tray {
		display: grid;
		width: 450px;
		height: 96px;
		touch-action: none;
		cursor: grab;
		outline: none;
	}

	.tray:active {
		cursor: grabbing;
	}

	.tray > svg {
		grid-area: 1/1;
		width: 450px;
		height: 96px;
		overflow: visible;
	}

	.lane {
		stroke: #8f86ff;
		stroke-opacity: 0.22;
		stroke-width: 1;
		stroke-dasharray: 2 6;
	}

	.turn {
		grid-area: 1/1;
		align-self: end;
		width: 44px;
		height: 44px;
		margin-bottom: 12px;
		padding: 0;
		border: none;
		background: none;
		color: #d8d2ff;
		opacity: 0.8;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition:
			opacity 0.15s,
			transform 0.1s;
		-webkit-tap-highlight-color: transparent;
	}

	.turn:hover {
		opacity: 1;
	}

	.turn:active {
		transform: scale(0.85);
	}

	.turn.left {
		justify-self: start;
		margin-left: 2px;
	}

	.turn.right {
		justify-self: end;
		margin-right: 2px;
	}
</style>
