<script lang="ts">
	import { onMount } from 'svelte';
	import { Game, SIDES } from '$lib/game/game.svelte';
	import type { Difficulty } from '$lib/game/logic';
	import Plan from '$lib/components/Plan.svelte';
	import Elevation from '$lib/components/Elevation.svelte';
	import Brushes from '$lib/components/Brushes.svelte';

	const game = new Game();
	const ready = $derived(game.sol.length > 0);
	const busy = $derived(game.phase === 'loading');

	onMount(() => {
		game.newPuzzle(4, 'easy');
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.key === 'ArrowRight') game.turn(1);
		else if (e.key === 'ArrowLeft') game.turn(-1);
		else if (e.key.length === 1 && '0123'.includes(e.key)) game.brush = +e.key as 0 | 1 | 2 | 3;
		else return;
		e.preventDefault();
	}

	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
	const sizes = [4, 5] as const;
	const diffs: [Difficulty, string][] = [
		['easy', 'Easy'],
		['hard', 'Hard']
	];
</script>

<svelte:window {onkeydown} />

<main class="game">
	<header class="intro">
		<h1>Edgewise</h1>
		<p class="rules">
			You see the board from the side, one edge at a time. Spheres come in three sizes.
			<b>A sphere hides anything its size or smaller behind it</b>, but a bigger one behind it still
			shows. Turn the board, mark the map, then press Done.
		</p>
	</header>

	<section class="sheet board" aria-label="Board" aria-busy={busy}>
		<div class="label"><span>Plan · your map</span><span>Turns with the board</span></div>
		<div class="planbox" class:dim={busy && ready}>
			{#if ready}
				<Plan {game} />
			{:else}
				<div class="placeholder">Drawing up a board…</div>
			{/if}
		</div>
		<div class="label">
			<span>Elevation · what you see</span>
			<strong aria-live="polite">From the {SIDES[game.side]}</strong>
		</div>
		<div class="elev" class:dim={busy && ready}>
			{#if ready}
				<Elevation sol={game.sol} side={game.side} key="{game.id}:{game.angle}" />
			{/if}
		</div>
		<div class="controls">
			<button onclick={() => game.turn(-1)} disabled={!ready} aria-keyshortcuts="ArrowLeft">
				↺ Turn left
			</button>
			<button onclick={() => game.turn(1)} disabled={!ready} aria-keyshortcuts="ArrowRight">
				Turn right ↻
			</button>
		</div>
	</section>

	<section class="sheet panel" aria-label="Marking">
		<div class="label"><span>Mark with</span><span>Tap again to clear</span></div>
		<Brushes {game} />
		<div class="row">
			<div class="stats">
				<span>Turns <b>{game.turns}</b></span>
				<span>Sides seen <b>{game.sidesSeen}/4</b></span>
			</div>
			<div class="segs">
				<div class="seg" role="group" aria-label="Board size">
					{#each sizes as n (n)}
						<button aria-pressed={game.N === n} onclick={() => game.newPuzzle(n)}>{n}×{n}</button>
					{/each}
				</div>
				<div class="seg" role="group" aria-label="Difficulty">
					{#each diffs as [d, name] (d)}
						<button aria-pressed={game.diff === d} onclick={() => game.newPuzzle(undefined, d)}>
							{name}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div role="status">
			{#if game.phase === 'solved'}
				<div class="result ok">
					Solved with {plural(game.turns, 'turn')}, {game.sidesSeen} of 4 sides seen.
				</div>
			{:else if game.phase === 'revealed'}
				<div class="result no">Solution shown. Outlined cells were wrong.</div>
			{:else if game.phase === 'play' && game.wrong.length}
				<div class="result no">
					{game.wrong.length === 1 ? '1 cell is' : `${game.wrong.length} cells are`} wrong. Fix them
					or
					<button class="inline" onclick={() => game.reveal()}>Show solution</button>
				</div>
			{/if}
		</div>

		<div class="controls">
			<button onclick={() => game.newPuzzle()}>New puzzle</button>
			<button class="primary" onclick={() => game.done()} disabled={game.phase !== 'play'}>
				Done
			</button>
		</div>
		<p class="hint">Keys: ← → to turn · 1 2 3 for sizes · 0 for empty</p>
	</section>
</main>

<style>
	.game {
		max-width: 460px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	/* Wide screens (desktop, itch.io embed): board on the left, sized to fit the viewport height. */
	@media (min-width: 760px) {
		.game {
			max-width: none;
			width: fit-content;
			display: grid;
			grid-template-columns: clamp(300px, calc((100dvh - 184px) / 1.27 + 30px), 560px) 340px;
			grid-template-areas: 'board intro' 'board panel';
			grid-template-rows: auto 1fr;
			align-items: start;
			column-gap: 24px;
		}
		.intro {
			grid-area: intro;
		}
		.board {
			grid-area: board;
		}
		.panel {
			grid-area: panel;
		}
	}

	.intro {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	h1 {
		font: 800 34px/1 var(--display);
		letter-spacing: -0.01em;
		margin: 0;
	}
	.rules {
		margin: 0;
		color: var(--muted);
		font-size: 14px;
		max-width: 62ch;
	}
	.rules b {
		color: var(--ink);
		font-weight: 600;
	}

	.sheet {
		background: var(--sheet);
		border: 1px solid var(--rule);
		border-radius: 10px;
		padding: 14px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}
	.label {
		font: 500 11px/1 var(--mono);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		display: flex;
		justify-content: space-between;
		gap: 8px;
		white-space: nowrap;
	}
	.label > :first-child {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.label strong {
		color: var(--ink);
		font-weight: 500;
	}

	.planbox {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
	}
	.placeholder {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: var(--muted);
		font: 500 12px var(--mono);
		border: 2px dashed var(--rule);
		border-radius: 8px;
	}
	.elev {
		min-height: 1px;
	}
	.dim {
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
	}
	.stats {
		display: flex;
		gap: 18px;
		font: 500 12px var(--mono);
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}
	.stats b {
		color: var(--ink);
		font-weight: 500;
	}
	.segs {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.seg {
		display: flex;
		border: 1px solid var(--rule);
		border-radius: 8px;
		overflow: hidden;
	}
	.seg button {
		border: 0;
		border-radius: 0;
		min-height: 38px;
		padding: 6px 12px;
		font: 500 13px var(--mono);
	}
	.seg button[aria-pressed='true'] {
		background: var(--ink);
		color: var(--sheet);
	}

	.result {
		border-radius: 8px;
		padding: 10px 12px;
		font-weight: 500;
		border: 1px solid;
	}
	.result.ok {
		color: var(--good);
		border-color: var(--good);
	}
	.result.no {
		color: var(--bad);
		border-color: var(--bad);
	}
	.inline {
		min-height: 32px;
		padding: 4px 10px;
		margin-left: 4px;
	}
	.hint {
		font-size: 12px;
		color: var(--muted);
		margin: 0;
	}
	@media (hover: none) {
		.hint {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dim {
			transition: none;
		}
	}
</style>
