<script lang="ts">
	import { onMount } from 'svelte';
	import { themes } from '$lib/themes';
	let { data, form } = $props();

	let chosenTheme: string | null = $state('crimson');
	let selectedTheme: string = $state('crimson');

	$effect(() => {
		if (form?.success) {
			document.documentElement.setAttribute('data-theme', form.success);
		}
	});

	onMount(() => {
		const cookiesTheme = data.theme;

		if (themes.indexOf(cookiesTheme) !== -1) {
			chosenTheme = data.theme;
			selectedTheme = chosenTheme;
		}
	});
</script>

<h3 class="h3">Appearance</h3>
<p class="mb-2">Customize your page theme</p>

<section class="space-y-6 rounded bg-surface-200-800 p-3">
	<div class="flex w-full items-center justify-between">
		<div>
			<p class="font-bold">Theme</p>
			<p class="text-xs">Choose a preferred color theme</p>
		</div>
		<form method="POST" action="?/changeTheme">
			<select
				class="select bg-surface-300-700 p-2 capitalize"
				bind:value={selectedTheme}
				name="theme"
			>
				{#each themes as theme}
					<option value={theme} class="capitalize" selected={theme === chosenTheme}>{theme}</option>
				{/each}
			</select>
			{#if selectedTheme !== chosenTheme && selectedTheme !== null}
				<button class="preset-filled-primadry-300-700 btn btn-sm" type="submit"
					>Confirm Theme</button
				>
			{/if}
		</form>
	</div>
</section>
