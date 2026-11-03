<script>
	// Hexodus's turn arrow shapes (after Egress's), on a 24-unit grid: a filled crescent along the arc of circle (cx, cy, r) from
	// angle a0, sweep degrees (screen coordinates, clockwise positive), thin at the tail (w0) and growing to w1 at the
	// head's base; the head hw wide and hl long. Returns its outline's points.
	const crescent = ({ cx, cy, r, a0, sweep, w0, w1, hw, hl, n = 24 }) => {
		const outer = [],
			inner = [];

		for (let i = 0; i <= n; i++) {
			const t = i / n,
				a = ((a0 + sweep * t) * Math.PI) / 180;
			const w = w0 + (w1 - w0) * Math.pow(t, 1.4);
			outer.push([cx + (r + w / 2) * Math.cos(a), cy + (r + w / 2) * Math.sin(a)]);
			inner.push([cx + (r - w / 2) * Math.cos(a), cy + (r - w / 2) * Math.sin(a)]);
		}

		const t = ((a0 + sweep) * Math.PI) / 180,
			dir = Math.sign(sweep);
		const [nx, ny] = [Math.cos(t), Math.sin(t)],
			[tx, ty] = [-Math.sin(t) * dir, Math.cos(t) * dir];
		const [ex, ey] = [cx + r * nx, cy + r * ny];
		const head = [
			[ex + (nx * hw) / 2, ey + (ny * hw) / 2],
			[ex + tx * hl, ey + ty * hl],
			[ex - (nx * hw) / 2, ey - (ny * hw) / 2]
		];

		return [...outer, ...head, ...inner.reverse()];
	};

	// centres an outline on the grid, by its bounding box
	const centred = (pts) => {
		const dx = 12 - (Math.min(...pts.map(([x]) => x)) + Math.max(...pts.map(([x]) => x))) / 2;
		const dy = 12 - (Math.min(...pts.map(([, y]) => y)) + Math.max(...pts.map(([, y]) => y))) / 2;
		return 'M' + pts.map(([x, y]) => `${(x + dx).toFixed(2)} ${(y + dy).toFixed(2)}`).join(' L') + ' Z';
	};

	// a turn: a shallow arc, thin at the bottom and curving up into the head (Hexodus's, turned upside down and
	// mirrored); left bows out to the left, right is its mirror image
	const TURN = { cx: 5, cy: 11, r: 10, a0: -62, sweep: 112, w0: 0.9, w1: 4.2, hw: 10, hl: 6 };
	const left = crescent(TURN).map(([x, y]) => [24 - x, 24 - y]);
	const ICONS = { left: centred(left), right: centred(left.map(([x, y]) => [24 - x, y])) };

	const { name, size = 30 } = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
	<path d={ICONS[name]} fill="currentColor" stroke="currentColor" stroke-width="0.6" stroke-linejoin="round" />
</svg>

<style>
	svg {
		filter: drop-shadow(0 0 3px #b8b0ff66);
	}
</style>
