<script>
	import RollerDigit from './Roller Digit.svelte';

	// A light stand-in for NumberFlow (after Leap of Fate's, but see Roller Digit: no animation on the compositor), for a
	// whole number of 0 or more. Its digits roll down as the number shrinks, up as it grows.
	const { value } = $props();

	// svelte-ignore state_referenced_locally
	let last = value;

	const dir = $derived.by(() => {
		const d = Math.sign(value - last) || 1;

		last = value;
		return d;
	});

	const places = $derived(Array.from({ length: String(value).length }, (_, i) => String(value).length - 1 - i));
</script>

<span class="roller" role="img" aria-label={String(value)}>
	{#each places as p (p)}
		<RollerDigit digit={Math.floor(value / 10 ** p) % 10} {dir} />
	{/each}
</span>

<style>
	.roller {
		display: inline-grid;
		grid-auto-flow: column;
		font-variant-numeric: tabular-nums;
	}
</style>
