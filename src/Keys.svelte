<script>
	import { fade } from 'svelte/transition';
	import { ss } from './shared.svelte';

	// the keyboard shortcuts, on a card over the page above the toolbar; a tap anywhere but the Keys button, or any
	// key, puts it away (the Keys button toggles it)
	const KEYS = [
		[['←', '→'], 'Turn the board'],
		[['1', '2', '3'], 'Mark the selected cell: small, medium, large'],
		[['0', 'Del', '⌫'], 'Clear the selected cell'],
		[['Esc'], 'Deselect the cell'],
		[['Tab', 'Enter'], 'Move between the buttons, press one'],
		[['?'], 'Show or hide this card']
	];

	$effect(() => {
		const onPointerDown = (e) => {
			if (!e.target.closest?.('#keys-button')) {
				delete ss.keys;
			}
		};

		window.addEventListener('pointerdown', onPointerDown, true);
		return () => window.removeEventListener('pointerdown', onPointerDown, true);
	});
</script>

<div class="ga11 scrim" transition:fade={{ duration: 200 }}>
	<div class="card" role="dialog" aria-label="Keyboard shortcuts">
		<div class="title">keyboard</div>
		<div class="rows">
			{#each KEYS as [caps, what] (what)}
				<div class="caps">
					{#each caps as cap (cap)}
						<kbd>{cap}</kbd>
					{/each}
				</div>
				<div class="what">{what}</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.scrim {
		display: grid;
		place-items: center;
		z-index: 10;
		background: #05041299;
	}

	/* the page's top corners, while it has them (#app-content) */
	@media (min-width: 451px) and (min-height: 801px) {
		.scrim {
			border-radius: 18px 18px 0 0;
		}
	}

	.card {
		display: grid;
		justify-items: center;
		gap: 26px;
		width: 370px;
		padding: 30px 28px 34px;
		box-sizing: border-box;
		border-radius: 24px;
		background: #0e0b28f0;
		border: 1px solid #8f86ff55;
		box-shadow: 0 0 40px #b06bff33;
	}

	.title {
		font-family: SM;
		font-size: 11px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #b8b0ff;
	}

	.rows {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 16px 18px;
	}

	.caps {
		display: flex;
		gap: 5px;
		justify-content: flex-end;
	}

	kbd {
		min-width: 14px;
		padding: 4px 7px 3px;
		border: 1px solid #ffd77a99;
		border-radius: 6px;
		background: #ffd77a14;
		color: #ffd77a;
		font-family: SM;
		font-size: 13px;
		text-align: center;
	}

	.what {
		font-family: QS;
		font-size: 16px;
		line-height: 1.3;
		color: #ece8ff;
	}
</style>
