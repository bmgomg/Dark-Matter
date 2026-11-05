<script>
	import Roller from './Roller.svelte';

	// dollars, rolling to a new value (as in Mixed Results); the digits go by the number's size, so a falling balance's roll
	// down above zero and up below it
	const { value } = $props();
</script>

{value < 0 ? '−' : ''}$<Roller value={Math.abs(value)} />
