<script lang="ts">
	import { page } from '$app/state';
	import Stat from '$lib/components/profile/Stat.svelte';
	import { User, UserPlus, Clock, Image, Users } from '@lucide/svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	let editDescription = $state(false);
	// svelte-ignore state_referenced_locally
	let newDescription = $state(data.profileUser.description);

	function CancelDescriptionEdit() {
		newDescription = '';
		editDescription = false;
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<main class="mx-auto max-w-5xl space-y-4 px-6 py-12">
	<!-- Hero -->
	<div
		class="relative flex items-center justify-center gap-16 rounded-xl bg-linear-to-b from-primary-500/50 to-90% py-8"
	>
		<div class="flex w-36 flex-col items-end gap-6">
			<Stat statName="Matches" statValue={0} />
			<Stat statName="Wins" statValue={0} />
		</div>

		<div class="flex flex-col items-center gap-3">
			<div class="rounded-full p-1 ring-4 ring-primary-500/20">
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
						<button class="btn gap-2 rounded-full preset-filled-primary-500 text-sm" type="submit">
							<UserPlus size={15} /> Add friend
						</button>
					{:else if data.friendStatus === 'pending'}
						<button class="btn rounded-full preset-tonal-surface text-sm" disabled>Pending</button>
					{:else if data.friendStatus === 'accepted'}
						<button class="btn rounded-full preset-tonal-success text-sm" disabled>Friends</button>
					{/if}
				</form>
			{/if}
		</div>

		<div class="flex w-36 flex-col items-start gap-6">
			<Stat statName="Win rate" statValue={0} />
			<Stat statName="Best streak" statValue={0} />
		</div>
	</div>

	<!-- Badges -->
	<div class="flex">
		<a
			href={`${page.url.pathname}/friends`}
			class="flex w-36 items-center justify-center gap-2 rounded-4xl bg-surface-400-600 p-2 text-center transition-all hover:scale-105"
			><Users size="24" /> {data.friends} Friends</a
		>
	</div>

	<!-- Cards -->
	<div class="grid grid-cols-1 gap-4">
		<section class="preset-glass-surface row-span-2 flex flex-col card rounded-2xl">
			<header
				class="flex items-center justify-between gap-2 border-b border-surface-500/20 px-4 py-3 text-xs font-semibold tracking-widest text-surface-400 uppercase"
			>
				<div class="flex gap-2">
					<User size={13} />
					<p>About</p>
				</div>
				{#if data.isOwner}
					{#if !editDescription}
						<button
							class="text-shadow-2xl rounded bg-secondary-500/70 p-1 px-3 text-surface-950-50 shadow-2xl
						transition-all hover:scale-105 hover:bg-secondary-500/90"
							onclick={() => (editDescription = true)}>Edit Description</button
						>
					{/if}
				{/if}
			</header>
			<div class="flex flex-1 flex-col gap-4 p-4">
				{#if editDescription}
					<form class="grid grid-rows-[--h-32_1fr]" method="POST" action="?/updateDescription">
						<textarea
							name="description"
							autocomplete="off"
							maxlength="200"
							class="h-32 resize-none rounded bg-surface-300 p-2 dark:bg-surface-400-600"
							bind:value={newDescription}
							placeholder="Enter your new description..."
						></textarea>
						<div class="flex gap-1 justify-self-end">
							<button
								onclick={CancelDescriptionEdit}
								class="m-1 btn preset-filled-error-500 btn-sm active:scale-95">Cancel</button
							>
							<button
								type="submit"
								class="my-1 btn preset-filled-success-500 btn-sm active:scale-95">Confirm</button
							>
						</div>
					</form>
				{:else}
					<p class="flex-1 text-sm leading-relaxed text-surface-300">
						{data.profileUser.description ?? 'No description yet.'}
					</p>
				{/if}

				<div class="border-t border-surface-500/20 pt-3">
					<p class="flex items-center gap-1 text-xs text-surface-500"><Clock size={11} /> Joined</p>
					<p class="mt-1 text-sm font-medium">{formatDate(data.user.createdAt)}</p>
				</div>
			</div>
		</section>
	</div>

	<!-- Gallery -->
	<section class="space-y-4">
		<h3
			class="flex items-center gap-2 text-sm font-semibold tracking-widest text-surface-400 uppercase"
		>
			<Image size={13} /> Gallery
		</h3>
		<div class="grid grid-cols-4 gap-2">
			{#each Array(8) as _}
				<img
					src="/player.webp"
					alt="gallery"
					class="aspect-square w-full rounded-xl object-cover opacity-90 transition-all hover:scale-[1.02] hover:opacity-100"
				/>
			{/each}
		</div>
	</section>
</main>
