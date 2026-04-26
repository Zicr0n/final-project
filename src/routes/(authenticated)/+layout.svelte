<script lang="ts">
	import { goto } from '$app/navigation';
	import LightSwitch from '$lib/components/global/LightSwitch.svelte';
	import { Cog, Hamburger, Menu, Search, ZoomIn } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let { children } = $props();
	let search = $state('');
	let toggleSearch = $state(false);
	let hideNav = $state(false);

	function OnSearch(event: SubmitEvent) {
		event.preventDefault();
		goto(`/search/users?q=${encodeURIComponent(search)}`);
	}

	const menuLinks = {};
</script>

<div class="grid h-screen grid-rows-[auto_1fr]">
	<!-- Header -->
	<nav
		class="preset-glass-surface fixed m-3 flex items-center gap-8 overflow-hidden rounded-4xl p-3 transition-all z-20"
	>
		<div class="flex gap-2">
			<button onclick={() => (hideNav = !hideNav)} class="transition-all hover:scale-105"
				><Menu /></button
			>
		</div>
		{#if !hideNav}
			<div
				class="shadow-4xl flex items-center gap-8 shadow-surface-600-400 transition-all h-8"
				transition:fade={{ duration: 200 }}
			>
				<div class="vr h-5 border-l-2 border-surface-600-400"></div>
				<a href="/rooms" class="transition-all hover:scale-105 flex-1">Rooms</a>
				<a href="/profile" class="transition-all hover:scale-105 flex-1">Profile</a>
				<div class="flex flex-1 gap-3">
					<div class="flex gap-1">
						<button class="" onclick={()=> toggleSearch = !toggleSearch}><Search/></button>
						{#if toggleSearch}
						<form onsubmit={OnSearch} class="flex gap-1">
							<input class="w-48 bg-surface-600-400 rounded-4xl text-sm px-2 text-center" name="search" bind:value={search} placeholder="Search for a user...">
							<button type="submit" class="btn btn-sm preset-tonal-success rounded-4xl" >Enter</button>
						</form>
						{/if}
					</div>
					<a href="/settings" class=" transition-all hover:rotate-30 align-text-bottom"><Cog /></a>
					<LightSwitch />
				</div>
			</div>
		{/if}
	</nav>

	<!-- Main -->
	<main class="min-h-screen bg-linear-to-br from-primary-500/20 via-transparent to-primary-900/20 ">
		{@render children()}
	</main>
</div>
