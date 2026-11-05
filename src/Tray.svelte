<script>
	import { MAP, R, SIDES, SWIPE_PX } from './const';
	import { elevation } from './logic';
	import Icon from './Icon.svelte';
	import Planet from './Planet.svelte';
	import { sideAt, spinTo, ss, stopTurning, turnBy } from './shared.svelte';

	// The view from the player's seat, edge-on: each lane seen along its line of sight, the planets centred on it, a
	// bigger one behind showing around the ones in front of it, like an annular eclipse. Swiping it turns the board:
	// the planets slide along with the finger and off the tray's end, all at one speed, so no depth shows. The next
	// side's lineup slides in from the other end only once a turn is made (released, and counted), so a drag can't
	// peek at it and come back.

	const H = 96;
	// where a large planet's bottom comes: the old floor line, which the separator below is spaced from
	const BOTTOM = 86;
	const HALF = MAP / 2;

	const pzl = $derived(ss.pzl);
	const N = $derived(pzl.N);
	const lane = $derived(MAP / N);
	// the line of sight, through every planet's centre: as low as a large planet allows
	const AXIS = $derived(BOTTOM - (R[3] / 100) * lane);
	const side = $derived(sideAt(pzl.step * 90));
	// a turn under way to another side, after a release or a tap: it counts, so the next lineup may come in
	const turning = $derived(ss.target !== undefined && ss.target !== pzl.step);

	const mod4 = (k) => ((k % 4) + 4) % 4;

	// the lineup a side shows, shifted along the tray by dx; tag tells an incoming lineup from the outgoing one
	const lineup = (s, dx, tag = '') => {
		const out = [];

		elevation(pzl.sol, s).forEach((visible, c) => {
			const x = -HALF + (c + 0.5) * lane + dx;

			// back to front, so the nearer ones are drawn over the ones behind them; a new puzzle's grow from their centres
			for (let k = visible.length - 1; k >= 0; k--) {
				const v = visible[k];
				const r = (R[v] / 100) * lane * (1 - ss.rise);
				out.push({ id: `${tag}${s}-${c}-${k}`, x, r, v, y: AXIS });
			}
		});

		return out;
	};

	// This side's lineup moves along with the board, off the tray's end as it turns away. Turning clockwise (a swipe to
	// the left) takes it off to the left. Once a turn to another side is made, that side's lineup slides in from the
	// other end, from off the tray all the way in, arriving as the turn ends. It sets off only once the old lineup is
	// LAG of the way out, as after a swipe let go of partway: a tap's turn starts from rest, and without the wait the
	// new lineup would chase the old one in.
	const LAG = 0.4;

	const planets = $derived.by(() => {
		const q = ss.angle / 90;
		const out = lineup(mod4(pzl.step), -(q - pzl.step) * SWIPE_PX);

		if (turning) {
			const span = ss.target - pzl.step;
			// how far through the whole turn the board is, and was when the turn was made
			const done = (q - pzl.step) / span;
			const start = Math.max(LAG, (ss.turnFrom / 90 - pzl.step) / span);
			const k = start >= 1 ? 1 : Math.min(1, Math.max(0, (done - start) / (1 - start)));
			out.push(...lineup(mod4(ss.target), Math.sign(span) * (1 - k) * SWIPE_PX, 'in'));
		}

		return out;
	});

	// a drag along the tray turns the board with it; a flick goes on to the next quarter, a slow drag settles on the nearest
	let drag = null;

	// a counted turn plays out first: a drag can't catch the board mid-turn; nor can one start while the map is flipping
	const onPointerDown = (e) => {
		if (drag || !pzl || turning || ss.flip || e.target.closest('button')) {
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
			<!-- a faint glow along the line of sight -->
			<radialGradient id="sight">
				<stop offset="0" stop-color="#ffcf7a" stop-opacity="0.16" />
				<stop offset="0.6" stop-color="#b06bff" stop-opacity="0.06" />
				<stop offset="1" stop-color="#b06bff" stop-opacity="0" />
			</radialGradient>
			<!-- the planets show only within the tray's ends -->
			<clipPath id="on-tray">
				<rect x={-HALF - 14} y="-40" width={MAP + 28} height={H + 80} />
			</clipPath>
		</defs>

		<ellipse cx="0" cy={AXIS} rx={HALF + 40} ry="44" fill="url(#sight)" />

		<g clip-path="url(#on-tray)">
			{#each planets as p (p.id)}
				<Planet x={p.x} y={p.y} r={p.r} size={p.v} />
			{/each}
		</g>
	</svg>

	<!-- as a swipe that way: the left one turns the board clockwise, the right one counterclockwise -->
	<button
		class="turn left"
		style:margin-top="{AXIS - 22}px"
		aria-label="Turn the board clockwise"
		aria-keyshortcuts="ArrowLeft"
		onclick={() => turnBy(1)}
	>
		<Icon name="left" />
	</button>
	<button
		class="turn right"
		style:margin-top="{AXIS - 22}px"
		aria-label="Turn the board counterclockwise"
		aria-keyshortcuts="ArrowRight"
		onclick={() => turnBy(-1)}
	>
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

	/* No easing scale on press: on a phone (measured on a Pixel 6a) it made a good third of the turn's frames miss their
	   time, nearly all of them at its start, which is the moment it plays. A layer of its own for the button didn't help.
	   Nor any hover on a touch screen: it stays on the arrow last tapped, so tapping the other one faded both, as the turn
	   began, with the same result. */
	.turn {
		grid-area: 1/1;
		align-self: start;
		width: 44px;
		height: 44px;
		padding: 0;
		border: none;
		background: none;
		color: #d8d2ff;
		opacity: 0.8;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: opacity 0.15s;
		-webkit-tap-highlight-color: transparent;
	}

	@media (hover: hover) {
		.turn:hover {
			opacity: 1;
		}
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
