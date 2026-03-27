<script>
    const { data } = $props()

</script>

{#each data.friendRequests as request}
    <section class="bg-cyan-300">
        <p>{request.senderId}</p>
        <form method="POST" action="?/removeFriend" class="inline">
        <p>{request.id}</p>
            <input name="requestId" value={request.id} hidden>
            <button>Remove Friend</button>
        </form>
    </section>
{/each}