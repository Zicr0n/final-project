<script>
	const { data } = $props();
</script>

{#if data.results.length > 0}
	{#each data.results as user}
		<a href={'/profile/' + user.id}>{user.username}</a>
	{/each}
{:else}
	<p>Nothing to be seen here!</p>
	<a href="javascript:window.history.back();">go back</a>
{/if}
