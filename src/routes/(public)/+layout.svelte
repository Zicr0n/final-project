<script lang="ts">
	import LightSwitch from '$lib/components/global/LightSwitch.svelte';
	import { User } from '@lucide/svelte';

	let { children } = $props();
</script>

<main class="min-h-screen">
	<header class="sticky top-0 z-50 border-b border-white/5 bg-surface-900/80 backdrop-blur-md">
		<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
			<div class="flex items-center gap-3">
				<div
					class="grid h-9 w-9 place-items-center rounded-xl bg-primary-500/15 text-primary-300 ring-1 ring-primary-400/30"
				>
					<User size={16} />
				</div>
				<span class="text-sm font-semibold tracking-widest text-surface-100 uppercase opacity-90">
					Project Name
				</span>
			</div>

			<div class="flex items-center gap-4">
				<nav class="hidden items-center gap-1 sm:flex">
					<a
						href="/"
						class="rounded-lg px-3 py-1.5 text-sm text-surface-200 transition-colors hover:bg-white/5 hover:text-white dark:text-surface-300"
						>Home</a
					>
					<a
						href="/about"
						class="rounded-lg px-3 py-1.5 text-sm text-surface-200 transition-colors hover:bg-white/5 hover:text-white dark:text-surface-300"
						>About</a
					>
					<a
						href="/contact"
						class="rounded-lg px-3 py-1.5 text-sm text-surface-200 transition-colors hover:bg-white/5 hover:text-white dark:text-surface-300"
						>Contact</a
					>
				</nav>
				<div class="vr h-8 border-surface-200 pr-2 dark:border-surface-300"></div>
				<LightSwitch />
			</div>
		</div>
	</header>

	{@render children()}
</main>

<style>
</style>
