<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const roomId = data.roomId;
	// svelte-ignore state_referenced_locally
	const password = data.password ?? '';

	let socket: ReturnType<typeof io> | null = null;
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	let players = $state<{ id: string; username: string, joined : boolean }[]>([]);
	let started = $state(false)
    let joined = $state(false)

	onMount(() => {
		connectionStatus = 'connecting';

		socket = io({
			auth: {
				userId: data.user.id,
				username: data.user.username
			}
		});

		socket.on('connect', () => {
			connectionStatus = 'connected';

			socket?.emit('join_room', {
				roomId,
				password
			});
		});

		socket.on('disconnect', () => {
			connectionStatus = 'disconnected';
		});

		socket.on('connect_error', () => {
			connectionStatus = 'disconnected';
		});

		socket.on('room_state', ({ players: roomPlayers, started : roomStarted }) => {
			players = roomPlayers;
			started = roomStarted
		});

		socket.on('room_error', ({ error }) => {
			alert(error);
			goto('/rooms');
		});

		socket.on('room_closed', () => {
			goto('/rooms');
		});
	});

	function AttemptJoinGame(){
		socket?.emit('join_game')
	}

	onDestroy(() => {
		socket?.disconnect();
	});
</script>

<h1 class="h1">{data.room.name}</h1>

<main class="p-4 space-y-4">
	<section class="card">
		<h2>Status</h2>
		<p class="status {connectionStatus}">
			{connectionStatus}
		</p>
	</section>

	<section class="card">
		<h2>Players in room</h2>

		{#if players.length === 0}
			<p>No one is in the room.</p>
		{:else}
			<ul class="player-list">
				{#each players as player}
					<li>{player.username}</li>
					<p>Joined : {player.joined}</p>
				{/each}
			</ul>
		{/if}
	</section>
    {#if started == false}		
        <section>
			<button 
			class="bg-green-300 p-4 text-black rounded-4xl hover:scale-105 transition-all"
			onclick={AttemptJoinGame}
			>
				Join Game
			</button>
		</section>
	{/if}



</main>

<style>
	.card {
		width: 100%;
		max-width: 700px;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 12px;
		background: white;
	}

	h2 {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
	}

	.status {
		font-weight: 600;
		text-transform: capitalize;
	}

	.status.connecting {
		color: #b45309;
	}

	.status.connected {
		color: #15803d;
	}

	.status.disconnected {
		color: #b91c1c;
	}

	.player-list {
		margin: 0;
		padding-left: 1.25rem;
	}
</style>