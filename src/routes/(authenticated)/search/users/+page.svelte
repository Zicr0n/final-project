<script lang="ts">
	import { goto } from '$app/navigation';

	const { data } = $props();

	import { Search, User, XIcon } from '@lucide/svelte';
	import { Avatar, Dialog, Portal, Tabs } from '@skeletonlabs/skeleton-svelte';

	let search = $state('');

	function OnSearch(event: SubmitEvent) {
		event.preventDefault();
		goto(`/search/users?q=${encodeURIComponent(search)}`);
	}

	const animation =
		'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>


<main class="my-16 flex h-full flex-col items-center px-30 space-y-2">
	<div class=" p-4 max-h-full bg-surface-200-800 rounded min-w-72 space-y-4">
		<form class="flex lg:flex-row flex-col items-center gap-2 lg:h-12
		w-full" onsubmit={OnSearch}>
			<input type="text" autocomplete="off" autocorrect="off"
			name="search" class="bg-surface-300-700 h-full flex-1
			rounded-xl pl-4 shadow-2xl input"
			placeholder="Enter a username..."
			bind:value={search}
			>
			<button class="btn lg:btn-group preset-filled-primary-400-600
			active:scale-95 active:bg-primary-700 h-full"><Search/>Search</button>
		</form>
		<h1 class="text-center h1 pt-10">Search results for : {data.query}</h1>
		<div class="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
			{#if data.results.length > 0}
				{#each data.results as user}
				<section class="preset-glass-surface h-full w-full lg:w-69 card p-3 card-hover justify-self-center">
						<a
							href={`/profile/${user.id}`}
						>
							<div class="flex gap-2 space-y-2">
								<Avatar class="size-20">
									<Avatar.Image src={user.image} alt="large" />
									<Avatar.Fallback><User/></Avatar.Fallback>
								</Avatar>
								<h7 class="h7">{user.username}</h7>
							</div>
						</a>
						<div class="flex w-full gap-2">
							<form class="w-full flex-1" method="POST" action="?/sendRequest">
								<button
									type="submit"
									class="z-10 btn w-full preset-filled-success-500 btn-base active:scale-95"
									>Add Friend</button
								>
								<input hidden class="hidden" name="otherId" value={user.id} />
							</form>
						</div>
					</section>
					{/each}
					{:else}
						<p>Nothing to see here...</p>
					{/if}
		</div>
	</div>
</main>
