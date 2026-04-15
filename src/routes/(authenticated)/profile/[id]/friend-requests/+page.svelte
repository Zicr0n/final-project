<script>
	const { data } = $props();
</script>

{#each data.friendRequests as request}
	<section class="bg-cyan-300">
		<p>{request.senderId}</p>
		<form method="POST" action="?/acceptRequest" class="inline">
			<input name="requestId" value={request.id} hidden />
			<button>Accept</button>
		</form>

		<form method="POST" action="?/rejectRequest" class="inline">
			<p>{request.id}</p>
			<input name="requestId" value={request.id} hidden />
			<button>Reject</button>
		</form>
	</section>
{/each}
