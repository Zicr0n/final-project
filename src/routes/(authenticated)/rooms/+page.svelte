<!-- src/routes/(authenticated)/rooms/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let roomList = $state([]);
	let roomName = $state('');
	let maxPlayers = $state(10);
	let error = $state('');
	let loading = $state(false);

	async function fetchRooms() {
		const res = await fetch('/rooms', {
			headers: { Accept: 'application/json' }
		});
		if (res.ok) roomList = await res.json();
	}

	onMount(fetchRooms);

	async function createRoom() {
		error = '';
		if (!roomName.trim()) {
			error = 'Room name cannot be empty.';
			return;
		}
		if (maxPlayers > 50 || maxPlayers < 1) {
			error = 'Max room size is 50.';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/rooms', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ name: roomName.trim(), maxPlayers })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error ?? 'Failed to create room.';
				return;
			}

			roomName = '';
			goto(`/rooms/${data.roomId}`);
		} finally {
			loading = false;
		}
	}

	function blockBadKeys(e) {
		if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
	}
</script>

<div class="page">
	<h1>Rooms</h1>

	<div class="create">
		<input
			bind:value={roomName}
			placeholder="Room name..."
			onkeydown={(e) => e.key === 'Enter' && createRoom()}
		/>
		<input
			type="number"
			name="roomSize"
			min="2"
			step="1"
			max="50"
			required
			onkeydown={blockBadKeys}
			bind:value={maxPlayers}
		/>
		<button onclick={createRoom} disabled={loading}>
			{loading ? 'Creating…' : 'Create room'}
		</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	</div>

	<div class="room-list">
		{#if roomList.length === 0}
			<p class="empty">No rooms yet. Create one!</p>
		{:else}
			{#each roomList as r}
				<a class="room-card" href={`/rooms/${r.roomId}`} data-sveltekit-preload-data="off">
					<span class="room-name">{r.name}</span>
					<span class="room-count">{r.playerCount}/{r.maxPlayers} players</span>
				</a>
			{/each}
		{/if}
	</div>
</div>

<style>
	.page {
		max-width: 600px;
		margin: 40px auto;
		padding: 0 20px;
		font-family: sans-serif;
	}

	h1 {
		margin-bottom: 24px;
	}

	.create {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.create input {
		flex: 1;
		padding: 8px 12px;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}

	.create button {
		padding: 8px 16px;
		font-size: 1rem;
		background: #4f46e5;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.create button:hover:not(:disabled) {
		background: #4338ca;
	}

	.create button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: red;
		font-size: 0.9rem;
		width: 100%;
		margin: 0;
	}

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.empty {
		color: #888;
	}

	.room-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		background: #f9f9f9;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		transition: background 0.15s;
	}

	.room-card:hover {
		background: #f0f0ff;
		border-color: #4f46e5;
	}

	.room-name {
		font-weight: 600;
	}

	.room-count {
		font-size: 0.85rem;
		color: #666;
	}
</style>