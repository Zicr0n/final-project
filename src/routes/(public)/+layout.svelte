<script lang="ts">
	let { children } = $props();
	import './layout.css';
</script>

<nav class="flex h-16 w-full justify-between bg-red-500 px-8">
	<div class="flex items-center justify-between gap-24 p-4">
		<p>HOME</p>
		<p>BLOG</p>
		<p>ABOUT</p>
		<p>ABOUT</p>
		<p>ABOUT</p>
		<p>ABOUT</p>
	</div>
	<div class="flex items-center justify-around gap-4 p-4">
		<p>LOGIN</p>
		<p>REGISTER</p>
	</div>
</nav>

<main class="h-screen">
	{@render children()}
</main>
