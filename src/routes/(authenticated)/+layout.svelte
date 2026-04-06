<script lang="ts">
	import { goto } from "$app/navigation";

	let { children } = $props();
	let search = $state("")


	function OnSearch(event : SubmitEvent){
		event.preventDefault();
		goto(`/search/users?q=${encodeURIComponent(search)}`)
	}
</script>

<div class="h-screen grid grid-rows-[auto_1fr]">
	<!-- Header -->
	<nav class="flex h-16 w-full justify-between bg-red-500 px-8">
			<div class="flex items-center justify-between gap-24 p-4">
				<a href="/rooms">ROOMS</a>
				<a href="/character">CHARACTER CUSTOMIZATION</a>
				<a href="/profile">PROFILE</a>
				<a href="/settings">SETTINGS</a>
				<form class="w-100" onsubmit={OnSearch} >
					<input placeholder="Search" name="q" class="w-full bg-green-300 p-1 rounded" bind:value={search}>
				</form>
			</div>
	</nav>

	<!-- Main -->
	<main class="h-full flex flex-col">
		<div class="flex-1">
			{@render children()}
		</div>
	</main>
</div>
