<script>
	let { children } = $props();
</script>

{@render children()}

<style>
	:global {
		body {
			margin: 0;
			padding: 0;
			height: 100dvh;
			width: 100%;
			font-family: SR;
			background: #05050f;
			color: #ece8ff;
			overflow: hidden;
		}

		.nohi {
			-webkit-tap-highlight-color: transparent;
			-webkit-touch-callout: none;
			-webkit-user-select: none;
			user-select: none;
		}

		.ga11 {
			grid-area: 1/1;
		}

		@font-face {
			font-family: CZ;
			src: url('$lib/fonts/Cinzel.ttf');
		}

		/* text, and its italic for hints and asides, as in Mixed Results */
		@font-face {
			font-family: SR;
			src: url('$lib/fonts/Spectral Regular.ttf');
		}

		@font-face {
			font-family: SI;
			src: url('$lib/fonts/Spectral Italic.ttf');
		}

		/* the home page's rules: rounder and friendlier than Spectral there (the designer's call) */
		@font-face {
			font-family: QS;
			src: url('$lib/fonts/Quicksand.ttf');
		}

		@font-face {
			font-family: SM;
			src: url('$lib/fonts/Space Mono.ttf');
		}

		/* on a gold button, selected or hovered: thin dark letters on the bright fill were hard to read, more so on a
		   phone. The same width as the regular, so nothing shifts. */
		@font-face {
			font-family: SM;
			font-weight: 700;
			src: url('$lib/fonts/Space Mono Bold.ttf');
		}
	}
</style>
