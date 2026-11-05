<script>
	import NumberFlow from '@number-flow/svelte';
	import { rolls } from './shared.svelte';

	// dollars, rolling to a new value (as in Mixed Results); trend -1 rolls the digits down as the balance falls
	const { value, trend = 1 } = $props();
</script>

<NumberFlow
	{value}
	{trend}
	animated={rolls()}
	format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }}
/>
