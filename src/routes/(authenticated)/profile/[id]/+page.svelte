<script>
	import { page } from '$app/state';
	import Stat from '$lib/components/profile/Stat.svelte';
	import { User, UserPlus, Clock, Image, Users } from '@lucide/svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	let editDescription = $state(false);
	// svelte-ignore state_referenced_locally
	let newDescription = $state(data.profileUser.description)

	function CancelDescriptionEdit(){
		newDescription = ""
		editDescription = false
	}
</script>

<main class="mx-auto max-w-5xl px-6 py-12 space-y-4">

	<!-- Hero -->
	<div class="relative flex items-center justify-center gap-16 py-8 bg-linear-to-b from-primary-500/30">

		<div class="flex flex-col items-end gap-6 w-36">
			<Stat statName="Matches" statValue={0} />
			<Stat statName="Wins" statValue={0} />
		</div>

		<div class="flex flex-col items-center gap-3">
			<div class="ring-4 ring-primary-500/20 rounded-full p-1">
				<Avatar class="size-36">
					<Avatar.Image src={data.profileUser.image} alt="avatar" />
					<Avatar.Fallback><User size={40} /></Avatar.Fallback>
				</Avatar>
			</div>
			<div class="text-center">
				<p class="text-sm text-surface-400">@{data.profileUser.username}</p>
			</div>

			{#if !data.isOwner}
				<form method="POST" action="?/sendRequest">
					{#if data.friendStatus === 'none'}
						<button class="btn preset-filled-primary-500 rounded-full gap-2 text-sm">
							<UserPlus size={15} /> Add friend
						</button>
					{:else if data.friendStatus === 'pending'}
						<button class="btn preset-tonal-surface rounded-full text-sm" disabled>Pending</button>
					{:else if data.friendStatus === 'accepted'}
						<button class="btn preset-tonal-success rounded-full text-sm" disabled>Friends</button>
					{/if}
				</form>
			{/if}
		</div>

		<div class="flex flex-col items-start gap-6 w-36">
			<Stat statName="Win rate" statValue={0} />
			<Stat statName="Best streak" statValue={0} />
		</div>
	</div>

	<!-- Badges -->
	<div class="flex">
		<a href={`${page.url.pathname}/friends`} class="flex gap-2 bg-surface-400-600 p-2 rounded-4xl w-36 justify-center text-center hover:scale-105 transition-all items-center"><Users size=24/> {data.friends} Friends</a>
	</div>

	<!-- Cards -->
	<div class="grid grid-cols-1 gap-4">

		<section class="card preset-glass-surface rounded-2xl row-span-2 flex flex-col">
			<header class="items-center gap-2 px-4 py-3 border-b border-surface-500/20 text-xs font-semibold uppercase tracking-widest text-surface-400 flex justify-between">
				<div class="flex gap-2">
					<User size={13} /> <p>About</p>
				</div>
				{#if data.isOwner}
					{#if !editDescription}
						<button class="shadow-2xl text-shadow-2xl bg-secondary-500/70 rounded p-1 px-3 text-surface-950-50
						transition-all hover:scale-105 hover:bg-secondary-500/90"
						onclick={()=> editDescription = true}
						>Edit Description</button>
					{/if}
				{/if}
			</header>
			<div class="p-4 flex flex-col gap-4 flex-1">
				
				{#if editDescription}
					<form class="grid grid-rows-[--h-32_1fr]" method="POST" action="?/updateDescription">
						<textarea name="description" autocomplete="off" maxlength="200" class="h-32 dark:bg-surface-400-600 bg-surface-300 p-2 resize-none" bind:value={newDescription} placeholder="Enter your new description..."></textarea>
						<div class="justify-self-end flex gap-1">
							<button onclick={CancelDescriptionEdit} class="btn btn-sm preset-filled-error-500 m-1 active:scale-95 ">Cancel</button>
							<button type="submit" class="btn btn-sm preset-filled-success-500 my-1 active:scale-95">Confirm</button>
						</div>
					</form>
				{:else}
					<p class="text-sm text-surface-300 leading-relaxed flex-1">
						{data.profileUser.description ?? 'No description yet.'}
					</p>
				{/if}
				
				<div class="border-t border-surface-500/20 pt-3">
					<p class="text-xs text-surface-500 flex items-center gap-1"><Clock size={11} /> Joined</p>
					<p class="text-sm font-medium mt-1">Jan 1 1970</p>
				</div>
			</div>
		</section>
	</div>

	<!-- Gallery -->
	<section class="space-y-4">
		<h3 class="text-sm font-semibold uppercase tracking-widest text-surface-400 flex items-center gap-2">
			<Image size={13} /> Gallery
		</h3>
		<div class="grid grid-cols-4 gap-2">
			{#each Array(8) as _}
				<img src="/player.webp" alt="gallery" class="rounded-xl aspect-square object-cover w-full opacity-90 hover:opacity-100 hover:scale-[1.02] transition-all" />
			{/each}
		</div>
	</section>

</main>