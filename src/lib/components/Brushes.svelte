<script lang="ts">
	import type { Game } from '$lib/game/game.svelte';
	import { NAMES } from '$lib/game/game.svelte';
	import type { Size } from '$lib/game/logic';
	import Sphere from './Sphere.svelte';
	import Cross from './Cross.svelte';

	let { game }: { game: Game } = $props();

	const BRUSHES: Size[] = [1, 2, 3, 0];
</script>

<div class="tools" role="group" aria-label="Mark with">
	{#each BRUSHES as v (v)}
		<button
			class="tool"
			aria-pressed={game.brush === v}
			aria-keyshortcuts={String(v)}
			onclick={() => (game.brush = v)}
		>
			<svg viewBox="0 0 100 100" aria-hidden="true">
				{#if v}
					<Sphere cx={50} cy={50} size={v} />
				{:else}
					<Cross half={20} />
				{/if}
			</svg>
			<span>{NAMES[v]}</span>
		</button>
	{/each}
</div>

<style>
	.tools {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	.tool {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 4px;
		font-weight: 500;
		font-size: 12px;
	}
	.tool svg {
		width: 30px;
		height: 30px;
		overflow: visible;
	}
	.tool[aria-pressed='true'] {
		border-color: var(--accent);
		box-shadow: inset 0 0 0 2px var(--accent);
	}
</style>
