// Puzzle rules, solver and generator, ported as-is from the edgewise.html prototype.
// Sizes: 0 = empty, 1 = small, 2 = medium, 3 = large.
// Candidate sets are 4-bit masks: bit v set means size v is still possible.

// set of sizes visible looking along seq from its first element
export const mask = (seq) => {
	let m = 0,
		mx = 0;
	for (const v of seq)
		if (v > mx) {
			m |= 1 << v;
			mx = v;
		}
	return m;
};
const has = (x, v) => (x >> v) & 1;
const single = (x) => (x & (x - 1)) === 0;

const SEQ = {};
function seqs(N) {
	if (SEQ[N]) return SEQ[N];
	const out = [],
		a = Array(N).fill(0);
	(function r(k) {
		if (k === N) {
			out.push({ s: a.slice(), f: mask(a) });
			return;
		}
		for (let v = 0; v < 4; v++) {
			a[k] = v;
			r(k + 1);
		}
	})(0);
	return (SEQ[N] = out);
}

// every view of every lane: cells listed front to back, plus the set of sizes seen
function laneViews(g) {
	const N = g.length,
		V = [];
	for (let i = 0; i < N; i++) {
		const c = Array.from({ length: N }, (_, j) => i * N + j);
		V.push({ cells: c, m: mask(g[i]) }, { cells: [...c].reverse(), m: mask([...g[i]].reverse()) });
	}
	for (let j = 0; j < N; j++) {
		const c = Array.from({ length: N }, (_, i) => i * N + j),
			col = g.map((r) => r[j]);
		V.push({ cells: c, m: mask(col) }, { cells: [...c].reverse(), m: mask([...col].reverse()) });
	}
	return V;
}

// Tier 1: empty lanes, nothing bigger than the biggest seen, a seen size with only one possible cell.
// Tier 2: adds hiding logic: an unseen size must sit behind something its size or bigger;
//         a seen size with nothing able to hide it must have all smaller seen sizes in front of it;
//         the first sphere from the front is the smallest one seen.
function human(cand, { cells, m }, tier) {
	let ch = false;
	const set = (c, nv) => {
		if (nv !== cand[c]) {
			cand[c] = nv;
			ch = true;
		}
	};
	if (m === 0) {
		for (const c of cells) set(c, 1);
		return ch;
	}
	const mx = 31 - Math.clz32(m),
		cap = (2 << mx) - 1;
	for (const c of cells) set(c, cand[c] & cap);
	for (let v = 1; v <= 3; v++) {
		if (!has(m, v)) continue;
		const pos = cells.filter((c) => has(cand[c], v));
		if (pos.length === 1) set(pos[0], 1 << v);
	}
	if (tier < 2) return ch;
	const seen = [1, 2, 3].filter((v) => has(m, v));
	for (let t = 0; t < cells.length; t++) {
		const before = cells.slice(0, t);
		let nv = cand[cells[t]];
		for (let v = 1; v <= 3; v++) {
			if (!has(nv, v)) continue;
			const canHide = before.some((b) => cand[b] >> v);
			if (canHide) continue;
			if (!has(m, v)) nv &= ~(1 << v);
			else if (!seen.filter((a) => a < v).every((a) => before.some((b) => has(cand[b], a)))) nv &= ~(1 << v);
		}
		set(cells[t], nv);
	}
	let t = 0;
	while (t < cells.length && cand[cells[t]] === 1) t++;
	if (t < cells.length && !has(cand[cells[t]], 0)) set(cells[t], cand[cells[t]] & (1 << seen[0]));
	return ch;
}

// Tier 3: consider every arrangement of one lane that fits one view (if/then reasoning).
function wholeLane(cand, { cells, m }, N) {
	const u = Array(N).fill(0);
	for (const q of seqs(N)) {
		if (q.f !== m) continue;
		let ok = true;
		for (let t = 0; t < N; t++)
			if (!has(cand[cells[t]], q.s[t])) {
				ok = false;
				break;
			}
		if (ok) for (let t = 0; t < N; t++) u[t] |= 1 << q.s[t];
	}
	let ch = false;
	for (let t = 0; t < N; t++) {
		const c = cells[t],
			nv = cand[c] & u[t];
		if (nv !== cand[c]) {
			cand[c] = nv;
			ch = true;
		}
	}
	return ch;
}

function solvesAt(N, V, tier) {
	const cand = Array(N * N).fill(15);
	let ch = true;
	while (ch) {
		ch = false;
		for (const v of V) if (tier <= 2 ? human(cand, v, tier) : wholeLane(cand, v, N)) ch = true;
	}
	return cand.every(single);
}

// lowest tier that fully solves the board; 0 = not solvable one view at a time (rejected).
// All rules are sound, so a full solve also proves the solution is unique.
export function tierOf(g) {
	const N = g.length,
		V = laneViews(g);
	for (const t of [1, 2, 3]) if (solvesAt(N, V, t)) return t;
	return 0;
}

export const RULES = {
	'4easy': { p: 0.35, ok: (t) => t === 1 || t === 2 },
	'4hard': { p: 0.5, ok: (t) => t === 3 },
	'5easy': { p: 0.25, ok: (t, n) => t === 2 && n === 5 }, // same rules as 4x4 Easy, more lanes
	'5hard': { p: 0.3, ok: (t, n) => t >= 2 && n >= 6 } // more spheres to place
};

export function generate(N, diff) {
	const { p, ok } = RULES[N + diff];
	let tries = 0,
		fallback = null;
	return new Promise((resolve) => {
		(function batch() {
			for (let k = 0; k < 400; k++, tries++) {
				const g = Array.from({ length: N }, () =>
					Array.from({ length: N }, () => (Math.random() < p ? 1 + Math.floor(Math.random() * 3) : 0))
				);
				const n = g.flat().filter(Boolean).length;
				if (n < N) continue;
				const t = tierOf(g);
				if (ok(t, n)) return resolve(g);
				if (t && !fallback) fallback = g;
			}
			if (tries > 40000 && fallback) return resolve(fallback);
			setTimeout(batch, 0);
		})();
	});
}

const rotCW = (g) => {
	const N = g.length;
	return g.map((_, i) => g.map((__, j) => g[N - 1 - j][i]));
};
export const rotated = (g, r) => {
	for (let k = 0; k < r; k++) g = rotCW(g);
	return g;
};

// visible spheres in each lane when the board is turned r times clockwise,
// listed front to back (front of a lane = bottom row of the turned board)
export function elevation(sol, r) {
	const g = rotated(sol, r),
		N = g.length;
	return Array.from({ length: N }, (_, c) => {
		const visible = [];
		let mx = 0;
		for (let i = N - 1; i >= 0; i--) {
			const v = g[i][c];
			if (v > mx) {
				visible.push(v);
				mx = v;
			}
		}
		return visible;
	});
}
