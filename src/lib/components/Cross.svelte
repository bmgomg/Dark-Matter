<svelte:options namespace="svg" />

<script lang="ts">
	// the "empty" mark, centred in a 100-unit cell
	let { cx = 50, cy = 50, half = 12 }: { cx?: number; cy?: number; half?: number } = $props();
</script>

<line x1={cx - half} y1={cy - half} x2={cx + half} y2={cy + half} />
<line x1={cx + half} y1={cy - half} x2={cx - half} y2={cy + half} />

<style>
	line {
		stroke: var(--muted);
		stroke-width: 5;
		stroke-linecap: round;
		pointer-events: none;
	}
</style>
