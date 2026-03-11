<main class="flex flex-col justify-center items-center">
    <h1 class="text-8xl m-16">BLOG</h1>
    <div class="max-w-[50%] flex gap-4 flex-col rounded-2xl">
    {#each new Array(30) as i}
        <section class="grid grid-cols-2 rounded  h-48 bg-cyan-500">
        <img src="" alt="blog" class="p-2">

        <div class="p-2">
              <h3 class="text-4xl">BLOG_TITLE</h3>
              <p>BLOG_DESCRIPTION_SLIGHTLY_LENGTHY</p>
        </div>
        
    </section>
    {/each}
    </div>
</main>