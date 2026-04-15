<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { Application, AssetsLoader, Sprite, Text } from 'svelte-pixi';
</script>

<Application width={400} height={400} antialias>
	<AssetsLoader assets={['/assets/player.webp']}>
		<!-- renders once all assets have completed loading -->
		<Sprite x={200} y={200} texture={PIXI.Texture.from('/assets/w.webp')} anchor={0.5} scale={3} />

		<!--
     optionally, you can render a loading screen while assets are loading
    -->
		{#snippet loading({ progress })}
			<Text
				text="Loading..."
				anchor={0.5}
				x={200}
				y={200}
				style={{
					fill: 'white'
				}}
			/>
		{/snippet}
	</AssetsLoader>
</Application>
