<script lang="ts">  
	let { children } = $props();
</script>

<nav class="w-full h-16 bg-red-500 flex justify-between px-8">
   <div class="flex justify-between p-4 items-center gap-24">
        <a href="/rooms">ROOMS</a>
        <a href="/character">CHARACTER CUSTOMIZATION</a>
        <a href="/profile">PROFILE</a>
        <a href="/settings">SETTINGS</a>
   </div>

  
</nav>

<main class="h-screen">
	{@render children()}
</main>
