<script>
	import { tap } from './sound.svelte';
	import { post } from './utils';

	// a press shrinks the button and springs it back; it acts once it's back
	const { id, text, framed, style = '', disabled, sound = true, onClick } = $props();

	let scale = $state(1);
	let timer = null;

	const onTransitionEnd = (e) => {
		if (e.propertyName !== 'scale') {
			return;
		}

		if (scale < 1) {
			scale = 1;
		} else {
			post(onClick);
		}
	};

	const onPointerDown = () => {
		if (timer || disabled) {
			return;
		}

		if (sound) {
			tap();
		}

		scale = 0.85;
		timer = post(() => (timer = null), 500);
	};

	const onKeyDown = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onPointerDown();
		}
	};
</script>

<div
	{id}
	class="button nohi"
	class:framed
	class:text-only={!framed}
	class:disabled
	style="{style}; scale: {scale};"
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-disabled={disabled}
	onpointerdown={onPointerDown}
	onkeydown={onKeyDown}
	ontransitionend={onTransitionEnd}
>
	{#each text as line, i (i)}
		<div>{line}</div>
	{/each}
</div>

<style>
	.button {
		place-self: center;
		display: grid;
		place-items: center;
		transition:
			scale 0.1s,
			background 0.2s,
			color 0.2s,
			opacity 0.2s;
		cursor: pointer;
		box-sizing: border-box;
		white-space: pre;
		outline: none;
	}

	.text-only {
		font-family: SM;
		font-size: 11px;
		line-height: 1.35;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #d8d2ff;
		opacity: 0.85;
	}

	.text-only:hover {
		opacity: 1;
		color: #ffd77a;
	}

	.framed {
		padding: 13px 34px;
		border: 1px solid #ffd77a;
		border-radius: 999px;
		background: #ffd77a14;
		color: #ffd77a;
		font-family: SM;
		font-size: 15px;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		box-shadow:
			0 0 14px #ffd77a33,
			inset 0 0 10px #ffd77a1a;
	}

	.framed:hover,
	.framed:focus-visible {
		background: #ffd77a;
		color: #14102e;
		font-weight: 700;
	}

	.text-only:focus-visible {
		color: #ffd77a;
		text-decoration: underline;
	}

	.disabled {
		pointer-events: none;
		opacity: 0.3;
	}
</style>
