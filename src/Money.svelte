<script>
	import NumberFlow from '@number-flow/svelte';
	import { rolls } from './shared.svelte';

	// dollars, rolling to a new value (as in Mixed Results); trend: which way the digits roll, or a function that says
	const { value, trend = 1 } = $props();
</script>

<NumberFlow
	{value}
	{trend}
	animated={rolls()}
	format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }}
/>
