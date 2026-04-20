<script lang="ts">
	import LightSwitch from "$lib/components/global/LightSwitch.svelte";
	import { User } from "@lucide/svelte";

	let { children } = $props();
</script>

<main class="flex min-h-screen flex-col from-primary-100-900 to-surface-100-900 bg-linear-to-r">
	<header class="backdrop-blur-3xl bg-linear-to-b from-surface-100-900 to-transparent">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
			<div class="flex items-center gap-3">
				<div class="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg ring-1 ring-white/10">
					<User size={18} />
				</div>
				
				<h1 class="text-lg font-black tracking-wide text-white">PROJECT NAME</h1>
			</div>
			
			<div class="scale-95">
				<LightSwitch />
			</div>
		</div>
	</header>

	{@render children()}
	
</main>

<style>
	.preset-glass-neutral {
		background: color-mix(in oklab, var(--color-surface-50-950) 30%, transparent);
		box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-50-950) 30%, transparent) inset;
		backdrop-filter: blur(16px);
	}
</style>