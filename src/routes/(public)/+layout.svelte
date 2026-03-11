<script lang="ts">  
	let { children } = $props();
</script>

<nav class="w-full h-16 bg-red-500 flex justify-between px-8">
   <div class="flex justify-between p-4 items-center gap-24">
        <p>HOME</p>
        <p>BLOG</p>
        <p>ABOUT</p>
        <p>ABOUT</p>
        <p>ABOUT</p>
        <p>ABOUT</p>
   </div>
   <div class="flex justify-around p-4 items-center gap-4">
        <p>LOGIN</p>
        <p>REGISTER</p>
   </div>
</nav>

<main class="h-screen">
	{@render children()}
</main>
