<main class="flex flex-col items-center justify-center">
	<h1 class="m-16 text-8xl">BLOG</h1>
	<div class="flex max-w-[50%] flex-col gap-4 rounded-2xl">
		{#each new Array(30) as i}
			<section class="grid h-48 grid-cols-2 rounded bg-cyan-500">
				<img src="" alt="blog" class="p-2" />

				<div class="p-2">
					<h3 class="text-4xl">BLOG_TITLE</h3>
					<p>BLOG_DESCRIPTION_SLIGHTLY_LENGTHY</p>
				</div>
			</section>
		{/each}
	</div>
</main>
