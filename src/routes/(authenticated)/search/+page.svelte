<script lang="ts">
	import { goto } from "$app/navigation";
	import { Search } from "@lucide/svelte";

    let search = $state('');

	function OnSearch(event: SubmitEvent) {
		event.preventDefault();
		goto(`/search/users?q=${encodeURIComponent(search)}`);
	}

</script>

<main class="flex flex-col items-center justify-center h-full w-[60&]
space-y-4 pb-12 ">
    <div class="flex flex-col items-center">
        <h1 style="background-image: linear-gradient(to right, var(--color-primary-300), var(--color-primary-500), var(--color-primary-300), var(--color-primary-500), var(--color-primary-300))"
         class="lg:text-8xl h1 font-black bg-linear-to-r from-primary-400 via-pink-400 to-primary-500 bg-clip-text text-transparent bg-size-[200%_200%] animate-gradient-scroll">PROJECTNAME</h1>
        <h3 class="h3">Search For Users</h3>
    </div>
    <form class="flex lg:flex-row flex-col items-center gap-2 lg:h-12
    w-[50%] min-w-100" onsubmit={OnSearch}>
        <input type="text" autocomplete="off" autocorrect="off"
        name="search" class="bg-surface-300-700 h-full flex-1
        rounded-xl pl-4 shadow-2xl input"
        placeholder="Enter a username..."
        bind:value={search}
        >
        <button class="btn lg:btn-group preset-filled-primary-400-600
        active:scale-95 active:bg-primary-700 h-full"><Search/>Search</button>
    </form>
</main>