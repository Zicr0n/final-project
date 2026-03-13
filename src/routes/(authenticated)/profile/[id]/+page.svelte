<script>

    let { data } = $props()

</script>

<main class="m-4">
    <section class="w-full h-50 flex">
        <img src="src" alt="profile" class="w-50 bg-red-500">
        <div class="p-4 bg-green-500 w-full">
            <h1 class="text-6xl">{data.user.name}</h1>
            <p>Description</p>
        </div>
    </section>

    <section class="py-2">
        <h1 class="text-6xl py-6">Gallery</h1>
        <div class="grid grid-cols-4 ">
            {#each Array(30) as f}
                <img  src="/player.webp" alt="gallery post">
            {/each}
        </div>
    </section>
</main>