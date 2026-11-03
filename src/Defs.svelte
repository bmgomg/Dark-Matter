<!-- The planets, each drawn once on a unit circle (radius 1, centered on 0, 0) and used everywhere through
     <Planet>: 1 a golden moon, 2 an ocean world, 3 a gas giant. Lit from the upper left, like the whole sky. -->
<svg class="defs" aria-hidden="true">
	<defs>
		{#each [['1', '#fff6dc', '#f2c96a', '#b9802a', '#4f300a'], ['2', '#dafff8', '#47d0bb', '#15808a', '#05303b'], ['3', '#f6e9ff', '#b993f2', '#6b40c2', '#200d48']] as [k, a, b, c, d] (k)}
			<radialGradient id="body-{k}" cx="0.36" cy="0.32" r="0.78">
				<stop offset="0" stop-color={a} />
				<stop offset="0.3" stop-color={b} />
				<stop offset="0.72" stop-color={c} />
				<stop offset="1" stop-color={d} />
			</radialGradient>
		{/each}

		{#each [['1', '#ffd77a'], ['2', '#5ff2dc'], ['3', '#c49bff']] as [k, color] (k)}
			<radialGradient id="halo-{k}">
				<stop offset="0.78" stop-color={color} stop-opacity="0.55" />
				<stop offset="0.86" stop-color={color} stop-opacity="0.18" />
				<stop offset="1" stop-color={color} stop-opacity="0" />
			</radialGradient>
		{/each}

		<!-- the night side -->
		<radialGradient id="shade" cx="0.34" cy="0.3" r="0.9">
			<stop offset="0.45" stop-color="#000" stop-opacity="0" />
			<stop offset="0.85" stop-color="#000" stop-opacity="0.45" />
			<stop offset="1" stop-color="#000" stop-opacity="0.7" />
		</radialGradient>

		<radialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color="#000" stop-opacity="0.75" />
			<stop offset="1" stop-color="#000" stop-opacity="0" />
		</radialGradient>

		<clipPath id="disc"><circle r="1" /></clipPath>

		<g id="planet-1">
			<circle r="1.28" fill="url(#halo-1)" />
			<circle r="1" fill="url(#body-1)" />
			<g clip-path="url(#disc)">
				{#each [[0.28, -0.12, 0.17], [-0.32, 0.34, 0.13], [0.46, 0.42, 0.1], [-0.04, 0.63, 0.08], [-0.48, -0.08, 0.09], [0.05, -0.55, 0.07]] as [x, y, r] (`${x}${y}`)}
					<circle cx={x} cy={y} {r} fill="#6b4310" opacity="0.32" />
					<circle cx={x + r * 0.18} cy={y + r * 0.2} r={r * 0.82} fill="#fff1c4" opacity="0.18" />
				{/each}
			</g>
			<circle r="1" fill="url(#shade)" />
			<circle r="0.98" fill="none" stroke="#fff4cf" stroke-opacity="0.35" stroke-width="0.035" />
			<ellipse cx="-0.36" cy="-0.42" rx="0.26" ry="0.16" transform="rotate(-32 -0.36 -0.42)" fill="#fff" opacity="0.45" />
		</g>

		<g id="planet-2">
			<circle r="1.24" fill="url(#halo-2)" />
			<circle r="1" fill="url(#body-2)" />
			<g clip-path="url(#disc)">
				<path
					d="M-0.9 -0.15 C -0.55 -0.45 -0.2 -0.05 0.05 -0.3 S 0.5 -0.55 0.75 -0.25 L 0.6 0.05 C 0.3 -0.1 0.05 0.15 -0.35 0.05 Z"
					fill="#2f9e6a"
					opacity="0.55"
				/>
				<path d="M-0.2 0.45 C 0.05 0.3 0.35 0.45 0.55 0.35 L 0.45 0.65 C 0.2 0.75 -0.05 0.62 -0.2 0.45 Z" fill="#2f9e6a" opacity="0.5" />
				{#each [[-0.2, -0.48, 0.55, 0.07, -8], [0.3, 0.12, 0.5, 0.065, 6], [-0.25, 0.3, 0.42, 0.055, -4], [0.1, 0.72, 0.6, 0.05, 3]] as [x, y, rx, ry, a] (`${x}${y}`)}
					<ellipse cx={x} cy={y} {rx} {ry} transform="rotate({a} {x} {y})" fill="#f2fffd" opacity="0.42" />
				{/each}
			</g>
			<circle r="1" fill="url(#shade)" />
			<circle r="0.98" fill="none" stroke="#b9fff4" stroke-opacity="0.5" stroke-width="0.045" />
			<ellipse cx="-0.36" cy="-0.42" rx="0.25" ry="0.15" transform="rotate(-32 -0.36 -0.42)" fill="#fff" opacity="0.5" />
		</g>

		<g id="planet-3">
			<circle r="1.22" fill="url(#halo-3)" />
			<circle r="1" fill="url(#body-3)" />
			<g clip-path="url(#disc)">
				{#each [[-0.78, 0.12, '#f4e2ff', 0.22], [-0.56, 0.1, '#2c1366', 0.35], [-0.3, 0.16, '#e9cfff', 0.28], [-0.05, 0.08, '#3a1a7a', 0.3], [0.12, 0.2, '#2a1160', 0.4], [0.4, 0.09, '#f0d8ff', 0.25], [0.6, 0.14, '#24104f', 0.35]] as [y, h, color, o] (y)}
					<path d="M-1.2 {y} Q 0 {y + 0.07} 1.2 {y} L 1.2 {y + h} Q 0 {y + h + 0.07} -1.2 {y + h} Z" fill={color} opacity={o} />
				{/each}
				<ellipse cx="0.34" cy="0.3" rx="0.19" ry="0.1" fill="#ff9cc4" opacity="0.6" />
				<ellipse cx="0.34" cy="0.3" rx="0.1" ry="0.05" fill="#ffd2e4" opacity="0.5" />
			</g>
			<circle r="1" fill="url(#shade)" />
			<circle r="0.98" fill="none" stroke="#e7d2ff" stroke-opacity="0.45" stroke-width="0.03" />
			<ellipse cx="-0.36" cy="-0.44" rx="0.24" ry="0.14" transform="rotate(-32 -0.36 -0.44)" fill="#fff" opacity="0.4" />
		</g>
	</defs>
</svg>

<style>
	.defs {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
	}
</style>
