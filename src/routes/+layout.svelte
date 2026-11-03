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
			font-family: QS;
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

		@font-face {
			font-family: QS;
			src: url('$lib/fonts/Quicksand.ttf');
		}

		@font-face {
			font-family: SM;
			src: url('$lib/fonts/Space Mono.ttf');
		}
	}
</style>
