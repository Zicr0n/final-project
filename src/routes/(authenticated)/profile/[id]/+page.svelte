<script>
	let { data } = $props();
</script>

<main class="m-4">
	<section class="flex h-50 w-full">
		<img src="src" alt="profile" class="w-50 bg-red-500" />
		<div class="w-full bg-green-500 p-4">
			<h1 class="text-6xl">{data.profileUser?.username}</h1>
			<p>Description</p>
			<a href={'/profile/' + data.profileUser?.id + '/friends'}>Friends</a>
		</div>
	</section>

	{#if !data.isOwner}
		<p>Status : {data.friendStatus}</p>
		<section class="flex h-16 w-full" style="background-color:#86CECB;">
			{#if data.friendStatus == 'none'}
				<form method="POST" action="?/sendRequest">
					<button class="m-4 rounded px-2" style="background-color:#E12885;">Add Friend</button>
				</form>
			{:else if data.friendStatus == 'pending'}
				<button class="m-4 rounded bg-gray-500 px-2" disabled>Add Friend</button>
			{:else if data.friendStatus == 'accepted'}
				<button class="m-4 rounded bg-green-500 px-2" disabled>Friends :D</button>
			{/if}
		</section>
	{/if}

	<section class="py-2">
		<h1 class="py-6 text-6xl">Gallery</h1>
		<div class="grid grid-cols-4">
			{#each Array(30) as f}
				<img src="/player.webp" alt="gallery post" />
			{/each}
		</div>
	</section>
</main>
