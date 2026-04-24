<script lang="ts">
	import { goto } from '$app/navigation';
	import LightSwitch from '$lib/components/global/LightSwitch.svelte';
	import { Cog, Hamburger, Menu } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	

	let { children } = $props();
	let search = $state('');
	let hideNav = $state(false)

	function OnSearch(event: SubmitEvent) {
		event.preventDefault();
		goto(`/search/users?q=${encodeURIComponent(search)}`);
	}

	const menuLinks = {

	}
</script>

<div class="grid h-screen grid-rows-[auto_1fr]">
	<!-- Header -->
	<nav class="fixed flex preset-glass-surface rounded-4xl p-3 m-3 gap-8 items-center transition-all overflow-hidden">
		<div class="flex gap-2">
			<button onclick={()=> hideNav = !hideNav} class="hover:scale-105 transition-all"><Menu /></button>
		</div>
		{#if !hideNav}
			<div class="flex items-center gap-8 transition-all shadow-4xl shadow-surface-600-400" transition:fade={ {duration : 200}}>
				<div class="vr h-5 border-l-2 border-surface-600-400"></div>
				<a href="/rooms" class="hover:scale-105 transition-all">Rooms</a>
				<a href="/profile" class="hover:scale-105 transition-all">Profile</a>
				<a href="/settings" class="hover:rotate-30 transition-all"><Cog/></a>
				<LightSwitch/>
			</div>
		{/if}
	</nav>

	<!-- Main -->
    <main class="min-h-screen bg-linear-to-br from-primary-500/20 via-transparent to-primary-900/20">
	
		{@render children()}
    </main>
</div>
