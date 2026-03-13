<script>
	let { data } = $props();
</script>

<main class="m-4">
	<section class="flex h-50 w-full">
		<img src="src" alt="profile" class="w-50 bg-red-500" />
		<div class="w-full bg-green-500 p-4">
			<h1 class="text-6xl">{data.profileUser.username}</h1>
			<p>Description</p>
		</div>
	</section>

    {#if !data.isOwner}
        <p>Status : {data.friendStatus}</p>
        <section class="w-full h-16 flex" style="background-color:#86CECB;">
            {#if data.friendStatus == "none"}
                <form method="POST" action="?/sendRequest">
                    <button class="rounded m-4 px-2 " style="background-color:#E12885;">Add Friend</button>
                </form>

            {:else if data.friendStatus == "pending"}
                <button class="rounded m-4 px-2 bg-gray-500" disabled>Add Friend</button>

            {:else if data.friendStatus == "accepted"}
                <button class="rounded m-4 px-2 bg-green-500" disabled>Friends :D</button>
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
