<script>
	import { onMount, onDestroy } from 'svelte';
	import io from 'socket.io-client';
	import { goto } from '$app/navigation';

	let socket;
	let roomList = $state([]);
	let roomName = $state('');
	let error = $state('');

	onMount(() => {
		socket = io();

		// Receive full room list (on connect + any change)
		socket.on('room_list', (rooms) => {
			roomList = rooms;
		});

		// After creating a room, navigate straight into it
		socket.on('room_created', ({ roomId }) => {
			goto(`/rooms/${roomId}`);
		});

		socket.on('room_error', ({ error: err }) => {
			error = err;
		});
	});

	onDestroy(() => {
		socket?.disconnect();
	});

	function createRoom() {
		error = '';
		if (!roomName.trim()) {
			error = 'Room name cannot be empty.';
			return;
		}
		socket.emit('create_room', { name: roomName.trim() });
		roomName = '';
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
		<button onclick={createRoom}>Create room</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
	</div>

	<div class="room-list">
		{#if roomList.length === 0}
			<p class="empty">No rooms yet. Create one!</p>
		{:else}
			{#each roomList as room}
				<a class="room-card" href="/rooms/{room.roomId}">
					<span class="room-name">{room.name}</span>
					<span class="room-count"
						>{room.playerCount} player{room.playerCount !== 1 ? 's' : ''}</span
					>
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

	.create button:hover {
		background: #4338ca;
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
